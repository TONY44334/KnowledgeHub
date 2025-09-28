package com.example.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Repository;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/api")
public class BookController {

    private static final String RAPIDAPI_KEY = "09d1087a77msh8003cef6c78e753p13eafbjsn1cdff80684cf";
    private static final String RAPIDAPI_HOST = "annas-archive-api.p.rapidapi.com";
    private static final String GLITTER_NODE_URL = "https://lgate.glitternode.ru/v1/book";

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient client = HttpClient.newHttpClient();

    @Autowired
    private AdminBookRepository adminBookRepository;

    @Autowired
    private S3Client s3Client;

    @Autowired
    private S3Presigner s3Presigner;

    private final String bucketName = "knowledgehub-books";

    // =========================
    // Admin upload book
    // =========================
    @PostMapping("/admin/upload")
    public ResponseEntity<?> uploadAdminBook(
            @RequestParam("file") MultipartFile file,
            @RequestParam String title,
            @RequestParam String author,
            @RequestParam String publisher,
            @RequestParam String year,
            @RequestParam String format,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String description
    ) {
        try {
            String key = UUID.randomUUID() + "-" + file.getOriginalFilename();

            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .build(),
                    software.amazon.awssdk.core.sync.RequestBody.fromBytes(file.getBytes())
            );

            AdminBook book = new AdminBook();
            book.setTitle(title);
            book.setAuthor(author);
            book.setPublisher(publisher);
            book.setYear(year);
            book.setFormat(format);
            book.setLanguage(language != null ? language : "Unknown");
            book.setDescription(description != null ? description : "");
            book.setR2Key(key);

            adminBookRepository.save(book);

            return ResponseEntity.ok(Map.of("message", "Book uploaded successfully", "bookId", book.getId()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================
    // Admin download book (presigned URL)
    // =========================
    @GetMapping("/admin/download")
    public ResponseEntity<?> downloadAdminBook(@RequestParam String bookId) {
        try {
            AdminBook book = adminBookRepository.findById(bookId).orElse(null);
            if (book == null) return ResponseEntity.status(404).body(Map.of("error", "Book not found"));

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(book.getR2Key())
                    .build();

            String presignedUrl = s3Presigner.presignGetObject(
                            GetObjectPresignRequest.builder()
                                    .getObjectRequest(getObjectRequest)
                                    .signatureDuration(Duration.ofHours(1))
                                    .build()
                    )
                    .url()
                    .toString();

            return ResponseEntity.ok(Map.of("downloadUrl", presignedUrl));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================
// Admin update book
// =========================
@PutMapping("/admin/update")
public ResponseEntity<?> updateAdminBook(
        @RequestParam String bookId,
        @RequestParam(required = false) String title,
        @RequestParam(required = false) String author,
        @RequestParam(required = false) String publisher,
        @RequestParam(required = false) String year,
        @RequestParam(required = false) String format,
        @RequestParam(required = false) String language,
        @RequestParam(required = false) String description,
        @RequestParam(required = false) MultipartFile file
) {
    try {
        AdminBook book = adminBookRepository.findById(bookId).orElse(null);
        if (book == null) return ResponseEntity.status(404).body(Map.of("error", "Book not found"));

        // Update metadata
        if (title != null) book.setTitle(title);
        if (author != null) book.setAuthor(author);
        if (publisher != null) book.setPublisher(publisher);
        if (year != null) book.setYear(year);
        if (format != null) book.setFormat(format);
        if (language != null) book.setLanguage(language);
        if (description != null) book.setDescription(description);

        // Replace file if provided
        if (file != null) {
            // Delete old file from S3
            s3Client.deleteObject(builder -> builder.bucket(bucketName).key(book.getR2Key()).build());
            // Upload new file
            String key = UUID.randomUUID() + "-" + file.getOriginalFilename();
            s3Client.putObject(
                    PutObjectRequest.builder().bucket(bucketName).key(key).build(),
                    software.amazon.awssdk.core.sync.RequestBody.fromBytes(file.getBytes())
            );
            book.setR2Key(key);
        }

        adminBookRepository.save(book);
        return ResponseEntity.ok(Map.of("message", "Book updated successfully"));

    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
    }
}


    // =========================
    // Admin delete book
    // =========================
    @DeleteMapping("/admin/delete")
    public ResponseEntity<?> deleteAdminBook(@RequestParam String bookId) {
        try {
            AdminBook book = adminBookRepository.findById(bookId).orElse(null);
            if (book == null) return ResponseEntity.status(404).body(Map.of("error", "Book not found"));

            s3Client.deleteObject(builder -> builder.bucket(bucketName).key(book.getR2Key()).build());
            adminBookRepository.deleteById(bookId);

            return ResponseEntity.ok(Map.of("message", "Book deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================
    // Search books (Admin + Anna's Archive)
    // =========================
    @SuppressWarnings("unchecked")
    @GetMapping("/search")
    public ResponseEntity<?> searchBooks(@RequestParam String query) {
        try {
            List<Map<String, Object>> books = new ArrayList<>();
            List<AdminBook> adminBooks = adminBookRepository.findByTitleContainingIgnoreCase(query);

            for (AdminBook b : adminBooks) {
                Map<String, Object> book = new HashMap<>();
                book.put("id", b.getId());
                book.put("title", b.getTitle());
                book.put("author", b.getAuthor());
                book.put("publisher", b.getPublisher());
                book.put("year", b.getYear());
                book.put("format", b.getFormat());
                book.put("size", b.getSize() != null ? b.getSize() : "N/A");
                book.put("imgUrl", b.getImgUrl() != null ? b.getImgUrl() : "");
                book.put("language", b.getLanguage());
                book.put("descr", b.getDescription());
                book.put("isAdminBook", true);
                books.add(book);
            }

            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = String.format(
                    "https://%s/search?q=%s&cat=fiction,nonfiction,comic,magazine,musicalscore,other,unknown&skip=0&limit=40&ext=pdf,epub,mobi,azw3&sort=mostRelevant&source=libgenLi,libgenRs",
                    RAPIDAPI_HOST, encodedQuery
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("x-rapidapi-key", RAPIDAPI_KEY)
                    .header("x-rapidapi-host", RAPIDAPI_HOST)
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = mapper.readTree(response.body());
                JsonNode booksNode = root.path("books");

                if (booksNode.isArray()) {
                    for (JsonNode node : booksNode) {
                        String md5 = node.path("md5").asText("").trim();
                        boolean exists = adminBooks.stream().anyMatch(b -> md5.equals(b.getId()));
                        if (exists) continue;

                        Map<String, Object> book = new HashMap<>();
                        book.put("id", md5);
                        book.put("title", node.path("title").asText("Untitled"));
                        book.put("author", node.path("author").asText("Unknown"));
                        book.put("publisher", node.path("publisher").asText("Unknown Publisher"));
                        book.put("year", node.path("year").asText("N/A"));
                        book.put("descr", node.path("descr").asText(""));
                        book.put("format", node.path("format").asText("Unknown"));
                        book.put("size", node.path("size").asText("N/A"));
                        book.put("imgUrl", node.path("imgUrl").asText(""));
                        if (node.has("language")) book.put("language", node.get("language").asText("Unknown"));
                        if (node.has("pages")) book.put("pages", node.get("pages").asText("N/A"));
                        if (node.has("extension")) book.put("extension", node.get("extension").asText(""));
                        book.put("isAdminBook", false);
                        books.add(book);
                    }
                }
            }

            return ResponseEntity.ok(Map.of("books", books));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================
    // GlitterNode Book Detail
    // =========================
    @SuppressWarnings("unchecked")
    @PostMapping("/book-detail")
    public ResponseEntity<?> getBookDetail(@RequestBody Map<String, Object> payload) {
        try {
            List<String> bookIds = (List<String>) payload.get("book_ids");
            if (bookIds == null || bookIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "book_ids is required"));
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("book_ids", bookIds);
            requestBody.put("address", payload.getOrDefault("address", ""));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GLITTER_NODE_URL))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                return ResponseEntity.status(response.statusCode())
                        .body(Map.of("error", "Failed to fetch data from Glitter Node"));
            }

            JsonNode root = mapper.readTree(response.body());
            return ResponseEntity.ok(root);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================
    // Anna's Archive Download Links
    // =========================
    @GetMapping("/download")
    public ResponseEntity<?> getDownloadLinks(@RequestParam String md5) {
        try {
            String url = String.format("https://%s/download?md5=%s", RAPIDAPI_HOST, md5);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("x-rapidapi-key", RAPIDAPI_KEY)
                    .header("x-rapidapi-host", RAPIDAPI_HOST)
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                return ResponseEntity.status(response.statusCode())
                        .body(Map.of("error", "Failed to fetch download links"));
            }

            JsonNode root = mapper.readTree(response.body());
            if (!root.isArray()) {
                return ResponseEntity.status(500).body(Map.of("error", "Unexpected response format"));
            }

            List<String> links = new ArrayList<>();
            for (JsonNode link : root) {
                links.add(link.asText());
            }

            return ResponseEntity.ok(Map.of("links", links));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

// ==========================
// Inline Mongo Repository
// ==========================
@Repository
interface AdminBookRepository extends MongoRepository<AdminBook, String> {
    List<AdminBook> findByTitleContainingIgnoreCase(String title);
}

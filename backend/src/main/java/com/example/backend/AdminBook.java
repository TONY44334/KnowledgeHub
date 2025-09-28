package com.example.backend;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "admin_books") // MongoDB collection name
public class AdminBook {

    @Id
    private String id; // Unique identifier for MongoDB document

    private String title;
    private String author;
    private String publisher;
    private String year;
    private String format;
    private String size;
    private String language;
    private String imgUrl;   // Cover image URL
    private String r2Key;    // Key in Cloudflare R2 bucket (for download)
    private String description;

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getPublisher() { return publisher; }
    public void setPublisher(String publisher) { this.publisher = publisher; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getImgUrl() { return imgUrl; }
    public void setImgUrl(String imgUrl) { this.imgUrl = imgUrl; }

    public String getR2Key() { return r2Key; }
    public void setR2Key(String r2Key) { this.r2Key = r2Key; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

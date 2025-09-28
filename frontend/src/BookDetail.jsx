import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import placeholderImg from "./assets/Wabi Sabi Pattern.jpg";
import "./BookDetail.css";

function BookDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const baseBook = state?.book;

  const [bookData, setBookData] = useState({
    title: baseBook?.title || "Unknown Title",
    imgUrl: baseBook?.imgUrl || placeholderImg,
    author: baseBook?.author || "Unknown",
    publisher: baseBook?.publisher || "Unknown Publisher",
    year: baseBook?.year || "N/A",
    language: baseBook?.language || "N/A",
    extension: baseBook?.extension || baseBook?.format || "N/A",
    filesize: baseBook?.filesize || baseBook?.size || "N/A",
    series: baseBook?.series || "N/A",
    issn: baseBook?.issn || "N/A",
    descr: baseBook?.descr || "",
    id: baseBook?.id || "",
    ipfsCid: baseBook?.ipfsCid || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadLinks, setDownloadLinks] = useState([]);

  useEffect(() => {
    if (!baseBook) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError("");

      try {
        // 1. Get extra book details
        const res = await fetch("http://localhost:8080/api/book-detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ book_ids: [baseBook.id], address: "" }),
        });

        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();

        const key = baseBook.id.toUpperCase();
        const extra = data?.data?.book?.[key]?.book;

        if (extra) {
          const newImgUrl = extra.coverurl
            ? `https://libgen.li/covers/${extra.coverurl}`
            : null;

          if (newImgUrl) {
            const img = new Image();
            img.src = newImgUrl;
            img.onload = () => {
              setBookData((prev) => ({
                ...prev,
                imgUrl: newImgUrl,
              }));
            };
          }

          setBookData((prev) => ({
            ...prev,
            title: extra.title || prev.title,
            author: extra.author || prev.author,
            publisher: extra.publisher || prev.publisher,
            year: extra.year || prev.year,
            language: extra.language || prev.language,
            extension: extra.extension || prev.extension,
            filesize: extra.filesize || prev.filesize,
            series: extra.series || prev.series,
            issn: extra.issn || prev.issn,
            descr: extra.descr || prev.descr,
            id: extra.id || prev.id,
            ipfsCid: extra.ipfs_cid || prev.ipfsCid,
          }));
        } else {
          setError("⚠ Extra details not found; using basic info.");
        }

        // 2. Get download links
        if (baseBook.id) {
          const dlRes = await fetch(
            `http://localhost:8080/api/download?md5=${baseBook.id}`
          );
          if (dlRes.ok) {
            const dlData = await dlRes.json();
            setDownloadLinks(dlData.links || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch book details:", err);
        setError("⚠ Could not load extra details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [baseBook]);

  if (!baseBook) {
    return (
      <div className="details-container">
        <p>⚠ Book data missing. Go back and select again.</p>
        <button onClick={() => navigate(-1)}>⬅ Back</button>
      </div>
    );
  }

  return (
    <div className="details-container fade-in">
      <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>

      <div className="details-content">
        <div className="details-img">
          <img
            src={bookData.imgUrl}
            alt={bookData.title}
            onError={(e) => (e.currentTarget.src = placeholderImg)}
          />
        </div>

        <div className="details-info">
          <h1 className="book-title">{bookData.title}</h1>
          {loading && <div className="spinner"></div>}
          {error && <p className="error-msg">{error}</p>}

          <ul className="meta-list">
            <li><strong>Author:</strong> {bookData.author}</li>
            <li><strong>Publisher:</strong> {bookData.publisher} ({bookData.year})</li>
            <li><strong>Language:</strong> {bookData.language}</li>
            <li><strong>Format:</strong> {bookData.extension}</li>
            <li><strong>File Size:</strong> {bookData.filesize}</li>
            <li><strong>Series:</strong> {bookData.series}</li>
            <li><strong>ISSN:</strong> {bookData.issn}</li>
          </ul>

          {bookData.descr && (
            <div
              className="details-desc"
              dangerouslySetInnerHTML={{ __html: bookData.descr }}
            />
          )}

          {!loading && (
            <div className="download-section">
              {downloadLinks.length > 0 ? (
                downloadLinks.map((link, i) => (
                  <button
                    key={i}
                    className={`download-btn ${i > 0 ? "secondary" : ""}`}
                    onClick={() => window.open(link, "_blank")}
                  >
                    📥 Download {i + 1}
                  </button>
                ))
              ) : (
                <p className="error-msg">⚠ No download links found.</p>
              )}

              {bookData.id && (
                <>
                  <button
                    className="download-btn secondary"
                    onClick={() =>
                      window.open(`https://annas-archive.org/md5/${bookData.id}`, "_blank")
                    }
                  >
                    🌐 Anna’s Archive
                  </button>
                  <button
                    className="download-btn secondary"
                    onClick={() =>
                      window.open(`https://libgen.li/get.php?md5=${bookData.id}`, "_blank")
                    }
                  >
                    🌐 Libgen.li
                  </button>
                </>
              )}

              {bookData.ipfsCid && (
                <button
                  className="download-btn secondary"
                  onClick={() =>
                    window.open(
                      `https://gateway-ipfs.st/ipfs/${bookData.ipfsCid}?filename=${bookData.title}_${bookData.author}_liber3.${bookData.extension}`,
                      "_blank"
                    )
                  }
                >
                  🌐 IPFS Mirror
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookDetail;

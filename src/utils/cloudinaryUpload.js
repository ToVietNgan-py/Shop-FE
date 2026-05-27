// utils/cloudinaryUpload.js

/**
 * Lấy ENV runtime an toàn cho cả local + production
 */
const getEnv = (key) => {
    try {
        return import.meta.env?.[key] || "";
    } catch {
        return "";
    }
};

const CLOUD_NAME = getEnv("VITE_CLOUDINARY_CLOUD_NAME");
const UPLOAD_PRESET = getEnv("VITE_CLOUDINARY_UPLOAD_PRESET");

/**
 * Upload file trực tiếp lên Cloudinary
 * @param {File} file
 * @param {(progress: {percent: number}) => void} [onProgress]
 * @returns {Promise<string>} secure_url
 */
export function uploadToCloudinary(file, onProgress) {
    console.log("Cloudinary ENV:", {
        CLOUD_NAME,
        UPLOAD_PRESET,
    });

    return new Promise((resolve, reject) => {
        // Validate ENV bên trong Promise để tránh crash AntD Upload
        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            reject(
                new Error(
                    "Thiếu VITE_CLOUDINARY_CLOUD_NAME hoặc VITE_CLOUDINARY_UPLOAD_PRESET"
                )
            );
            return;
        }

        if (!file) {
            reject(new Error("Không tìm thấy file upload"));
            return;
        }

        const body = new FormData();

        body.append("file", file);
        body.append("upload_preset", UPLOAD_PRESET);

        // folder optional
        body.append("folder", "products");

        const xhr = new XMLHttpRequest();

        // progress
        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress({
                    percent: Math.round(
                        (e.loaded / e.total) * 100
                    ),
                });
            }
        });

        // success / fail
        xhr.onreadystatechange = () => {
            if (xhr.readyState !== 4) return;

            try {
                const data = JSON.parse(xhr.responseText);

                console.log("Cloudinary response:", data);

                if (
                    xhr.status >= 200 &&
                    xhr.status < 300 &&
                    data.secure_url
                ) {
                    resolve(data.secure_url);
                    return;
                }

                reject(
                    new Error(
                        data?.error?.message ||
                        "Upload Cloudinary thất bại"
                    )
                );
            } catch (err) {
                console.error("Cloudinary parse error:", err);
                console.error("Raw response:", xhr.responseText);

                reject(
                    new Error(
                        "Không đọc được phản hồi từ Cloudinary"
                    )
                );
            }
        };

        xhr.onerror = () => {
            reject(new Error("Lỗi kết nối Cloudinary"));
        };

        xhr.onabort = () => {
            reject(new Error("Upload đã bị huỷ"));
        };

        xhr.open(
            "POST",
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
        );

        xhr.send(body);
    });
}
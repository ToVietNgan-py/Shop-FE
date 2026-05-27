const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload file trực tiếp lên Cloudinary (unsigned upload preset).
 * @param {File} file
 * @param {(progress: {percent: number}) => void} [onProgress]
 * @returns {Promise<string>} secure_url
 */
export function uploadToCloudinary(file, onProgress) {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        return Promise.reject(
            new Error("Cloudinary chưa cấu hình. Thêm VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET vào .env")
        );
    }

    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", UPLOAD_PRESET);
    body.append("folder", "products");

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress({ percent: Math.round((e.loaded / e.total) * 100) });
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                resolve(data.secure_url);
            } else {
                try {
                    const err = JSON.parse(xhr.responseText);
                    reject(new Error(err?.error?.message || "Upload thất bại"));
                } catch {
                    reject(new Error("Upload thất bại"));
                }
            }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload thất bại")));
        xhr.addEventListener("abort", () => reject(new Error("Upload bị huỷ")));

        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
        xhr.send(body);
    });
}

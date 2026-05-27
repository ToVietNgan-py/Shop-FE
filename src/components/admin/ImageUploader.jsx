import { Image, Modal, Upload } from "antd";
import { useEffect, useMemo, useState } from "react";

const toPreviewSource = (file) => file.url ?? file.thumbUrl ?? (file.originFileObj ? URL.createObjectURL(file.originFileObj) : "");

const normalizeValue = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map((item, index) => {
        if (typeof item === "string") {
            return {
                uid: `${item}-${index}`,
                name: item.split("/").pop() || `image-${index + 1}`,
                status: "done",
                url: item
            };
        }

        return {
            uid: item.uid ?? `${index}`,
            name: item.name ?? `image-${index + 1}`,
            status: item.status ?? "done",
            url: item.url,
            thumbUrl: item.thumbUrl,
            originFileObj: item.originFileObj
        };
    });
};

function ImageUploader({ value = [], onChange, maxCount = 5, label = "Ảnh sản phẩm", hint = "Tải ảnh lên để xem trước trước khi lưu.", customRequest }) {
    const [fileList, setFileList] = useState(() => normalizeValue(value));
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");

    useEffect(() => {
        setFileList(normalizeValue(value));
    }, [value]);

    const handlePreview = async (file) => {
        setPreviewImage(toPreviewSource(file));
        setPreviewOpen(true);
    };

    const handleChange = ({ fileList: nextList }) => {
        // Khi customRequest upload xong, extract URL từ response vào file.url
        const normalized = nextList.map((file) => {
            if (file.status === "done" && file.response?.url && !file.url) {
                return { ...file, url: file.response.url };
            }
            return file;
        });
        setFileList(normalized);

        if (typeof onChange === "function") {
            onChange(normalized);
        }
    };

    const uploadButton = useMemo(() => (
        <div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>{label}</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>{hint}</div>
        </div>
    ), [hint, label]);

    return (
        <>
            <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={handleChange}
                onPreview={handlePreview}
                beforeUpload={customRequest ? undefined : () => false}
                customRequest={customRequest}
                maxCount={maxCount}
            >
                {fileList.length >= maxCount ? null : uploadButton}
            </Upload>

            <Modal open={previewOpen} footer={null} onCancel={() => setPreviewOpen(false)}>
                <Image alt="preview" src={previewImage} preview={false} />
            </Modal>
        </>
    );
}

export default ImageUploader;
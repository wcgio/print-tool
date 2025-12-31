"use client";

import {useCallback, useRef, useState} from "react";
import {jsPDF} from "jspdf";

type PaperSize = "A3" | "A4" | "A5";
type Orientation = "portrait" | "landscape";

interface PaperConfig {
  width: number;
  height: number;
  label: string;
}

const PAPER_SIZES: Record<PaperSize, PaperConfig> = {
  A3: { width: 297, height: 420, label: "A3 (297×420 毫米)" },
  A4: { width: 210, height: 297, label: "A4 (210×297 毫米)" },
  A5: { width: 148, height: 210, label: "A5 (148×210 毫米)" },
};

const WHITE_BORDER_MM = 16;

export default function Home() {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [paperSize, setPaperSize] = useState<PaperSize>("A4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const getCurrentPaperDims = useCallback(() => {
    const paper = PAPER_SIZES[paperSize];
    if (orientation === "portrait") {
      return { width: paper.width, height: paper.height };
    } else {
      return { width: paper.height, height: paper.width };
    }
  }, [paperSize, orientation]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = Array.from(e.dataTransfer.items);
    const allFiles: File[] = [];

    for (const item of items) {
      const entry = item.webkitGetAsEntry?.();
      if (!entry) continue;

      if (entry.isFile) {
        const file = await getFileFromEntry(entry as FileSystemFileEntry);
        if (file && file.type.startsWith("image/")) {
          allFiles.push(file);
        }
      } else if (entry.isDirectory) {
        const files = await readDirectoryEntry(entry as FileSystemDirectoryEntry);
        allFiles.push(...files);
      }
    }

    if (allFiles.length > 0) {
      addImages(allFiles);
    }
  };

  const getFileFromEntry = (entry: FileSystemFileEntry): Promise<File | null> => {
    return new Promise((resolve) => {
      entry.file((file) => resolve(file), () => resolve(null));
    });
  };

  const readDirectoryEntry = async (dirEntry: FileSystemDirectoryEntry): Promise<File[]> => {
    const files: File[] = [];

    const readEntries = async (reader: FileSystemDirectoryReader): Promise<void> => {
      const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });

      for (const entry of entries) {
        if (entry.isFile) {
          const file = await getFileFromEntry(entry as FileSystemFileEntry);
          if (file && file.type.startsWith("image/")) {
            files.push(file);
          }
        } else if (entry.isDirectory) {
          await readDirectoryEntry(entry as FileSystemDirectoryEntry);
        }
      }

      if (entries.length > 0) {
        await readEntries(reader);
      }
    };

    const reader = dirEntry.createReader();
    await readEntries(reader);

    return files;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    addImages(files);
  };

  const addImages = (files: File[]) => {
    const newImages = [...images, ...files];
    setImages(newImages);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const resetAll = () => {
    setImages([]);
    setImagePreviews([]);
    setPaperSize("A4");
    setOrientation("portrait");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const exportPDF = async () => {
    if (images.length === 0) return;

    setIsExporting(true);
    try {
      const { width: pageWidth, height: pageHeight } = getCurrentPaperDims();
      const pdf = new jsPDF({
        orientation: orientation === "portrait" ? "p" : "l",
        unit: "mm",
        format: paperSize.toLowerCase() as any,
      });

      for (let i = 0; i < images.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const imgData = imagePreviews[i];
        const img = await loadImage(imgData);

        const contentWidth = pageWidth - WHITE_BORDER_MM * 2;
        const contentHeight = pageHeight - WHITE_BORDER_MM * 2;

        const imgAspectRatio = img.width / img.height;
        const contentAspectRatio = contentWidth / contentHeight;

        let finalWidth, finalHeight;

        if (imgAspectRatio > contentAspectRatio) {
          finalWidth = contentWidth;
          finalHeight = contentWidth / imgAspectRatio;
        } else {
          finalHeight = contentHeight;
          finalWidth = contentHeight * imgAspectRatio;
        }

        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        pdf.addImage(imgData, "JPEG", x, y, finalWidth, finalHeight);
      }

      pdf.save(`图片转换_${paperSize}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("导出PDF失败:", error);
      alert("导出PDF失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const { width: pageWidth, height: pageHeight } = getCurrentPaperDims();
  const aspectRatio = pageWidth / pageHeight;

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部标题 */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="w-full flex justify-center items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            图片批量处理小工具
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧：上传与设置 */}
          <div className="w-full lg:w-1/3 space-y-4">
            {/* 上传区域 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                上传图片
              </h2>

              <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer 
                ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}
                onClick={() => fileInputRef.current?.click()}>
                <svg className="w-12 h-12 mx-auto mb-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <p className="text-gray-600 mb-2">拖拽图片或文件夹到此处</p>
                <p className="text-sm text-gray-500">支持拖拽文件夹，自动提取其中图片</p>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden"/>
              <input ref={folderInputRef} type="file" {...({webkitdirectory: "", directory: ""} as any)} multiple onChange={handleFolderSelect} className="hidden"/>

              <div className="flex gap-2 mt-3">
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex-1 font-bold bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors">
                  选择文件
                </button>
                <button onClick={() => folderInputRef.current?.click()}
                  className="flex-1 font-bold bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors">
                  选择文件夹
                </button>
                <button onClick={resetAll} className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded transition-colors">
                  清空
                </button>
              </div>

              {/* 已选图片列表 */}
              {images.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-gray-600">
                    已选择 {images.length} 张图片：
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {images.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                        <span className="text-sm truncate flex-1">
                          {file.name}
                        </span>
                        <button onClick={() => removeImage(index)} className="ml-2 text-red-500 hover:text-red-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 纸张设置 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                纸张设置
              </h2>

              <div className="space-y-4">
                {/* 纸张大小 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">纸张大小</label>
                  <select value={paperSize} onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="A3">{PAPER_SIZES.A3.label}</option>
                    <option value="A4">{PAPER_SIZES.A4.label}</option>
                    <option value="A5">{PAPER_SIZES.A5.label}</option>
                  </select>
                </div>

                {/* 方向 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">方向</label>
                  <div className="flex gap-2">
                    <button onClick={() => setOrientation("portrait")} className={`flex-1 font-bold py-2 px-4 rounded transition-colors 
                      ${orientation === "portrait" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
                      纵向
                    </button>
                    <button onClick={() => setOrientation("landscape")} className={`flex-1 font-bold py-2 px-4 rounded transition-colors 
                      ${orientation === "landscape" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
                      横向
                    </button>
                  </div>
                </div>

                {/* 白边说明 */}
                <div className="bg-blue-50 rounded p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" clipRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
                    </svg>
                    <p className="text-sm text-blue-700">图片将完整显示，四周自动添加 {WHITE_BORDER_MM} 毫米白边</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 导出按钮 */}
            <button onClick={exportPDF} disabled={images.length === 0 || isExporting} className={`w-full py-3 px-6 rounded-lg font-medium transition-colors 
              ${images.length === 0 || isExporting ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white"}`}>
              {isExporting ? "导出中..." : "导出PDF"}
            </button>
          </div>

          {/* 右侧：预览与说明 */}
          <div className="w-full lg:w-2/3 space-y-4">
            {/* 预览区域 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  预览
                </h2>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" clipRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
                  </svg>
                  预览区域显示所选纸张的实际比例
                </div>
              </div>

              <div className="bg-white rounded border p-4 flex items-center justify-center min-h-[400px]">
                {imagePreviews.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 w-full">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative border-2 border-dashed border-gray-300 rounded p-2"
                        style={{aspectRatio: `${aspectRatio}`, maxWidth: "300px", margin: "0 auto",}}>
                        <img src={src} alt={`预览 ${index + 1}`} className="w-full h-full object-contain"/>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <p>请上传图片以预览</p>
                  </div>
                )}
              </div>
            </div>

            {/* 使用说明 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                使用说明
              </h2>

              <ol className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>图片如有太多无关内容，请先裁剪掉无用内容（指定范围截图保存）后再上传</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>上传一张或多张图片（支持拖拽）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>选择纸张大小（A3、A4、A5）和方向</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                    4
                  </span>
                  <span>预览确认后点击"导出PDF"按钮</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                    5
                  </span>
                  <span>
                    所有图片将合并到一个PDF文件中，每个图片占一张纸
                  </span>
                </li>
              </ol>
            </div>

            {/* 纸张尺寸参考 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">A系列纸张尺寸</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">规格</th>
                      <th className="text-left py-2 px-3">尺寸 (毫米)</th>
                      <th className="text-left py-2 px-3">常见用途</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 px-3 font-medium text-orange-600">A3</td>
                      <td className="py-2 px-3">297 × 420</td>
                      <td className="py-2 px-3">海报、图表、两页A4并排</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-3 font-medium text-orange-600">A4</td>
                      <td className="py-2 px-3">210 × 297</td>
                      <td className="py-2 px-3">标准文档、打印纸</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-orange-600">A5</td>
                      <td className="py-2 px-3">148 × 210</td>
                      <td className="py-2 px-3">笔记本、小册子</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 概述 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">概述</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                本工具可以帮助您快速将图片转换为标准纸张大小的PDF文件。支持A3、A4、A5三种常用纸张规格，可自由选择纵向或横向方向。
                图片将自动适应纸张大小，并在四周添加16毫米白边，确保打印效果美观。支持批量上传多张图片，所有图片将合并到一个PDF文件中，每个图片占一张纸。
              </p>
            </div>

            {/* 常见用途 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">常见用途</h2>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li>• 将手机照片转换为可打印的标准文档</li>
                <li>• 制作带白边的照片打印稿</li>
                <li>• 将设计稿导出为指定纸张尺寸</li>
                <li>• 批量处理多张图片的打印布局</li>
              </ul>
            </div>

            {/* 其他注意事项 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">其他注意事项</h2>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li>• 图片处理完全在浏览器本地完成，不会上传到服务器</li>
                <li>• 支持JPG、PNG、WEBP等常见图片格式</li>
                <li>• 导出的PDF文件可直接用于打印</li>
                <li>• 建议使用分辨率较高的图片以获得更好的打印效果</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="mt-12 py-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          图片转换工具 | 纯前端处理，保护您的隐私
        </div>
      </footer>
    </div>
  );
}

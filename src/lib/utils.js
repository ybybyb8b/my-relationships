import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// 1. ClassName 合并工具 (cn)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 2. 全局颜色配置 (莫兰迪拍立得风格)
export const THEME_COLORS = {
  blue:   { paper: "bg-[#D5E1E6]", photo: "bg-[#BCCCD3]", text: "text-[#586E75]" },
  pink:   { paper: "bg-[#EEDADD]", photo: "bg-[#DBC2C6]", text: "text-[#8C5E65]" },
  green:  { paper: "bg-[#CCD5AE]", photo: "bg-[#B0BB96]", text: "text-[#5F6C38]" },
  yellow: { paper: "bg-[#FAE1DD]", photo: "bg-[#E8C6C0]", text: "text-[#8D5B54]" },
  purple: { paper: "bg-[#E2DAEB]", photo: "bg-[#CCC0DB]", text: "text-[#69587B]" },
  orange: { paper: "bg-[#F4D0B8]", photo: "bg-[#E3BA9E]", text: "text-[#8F5B3E]" },
  teal:   { paper: "bg-[#C4E0E0]", photo: "bg-[#A8CFCF]", text: "text-[#4A7272]" },
  cyan:   { paper: "bg-[#CFE6EA]", photo: "bg-[#B3D6DC]", text: "text-[#4F757D]" },
  lime:   { paper: "bg-[#E9EDC9]", photo: "bg-[#D6DBA6]", text: "text-[#6C733D]" },
  indigo: { paper: "bg-[#D6D8E8]", photo: "bg-[#BEC1D8]", text: "text-[#535775]" },
  
  default: { paper: "bg-[#F3F4F6]", photo: "bg-[#E5E7EB]", text: "text-[#374151]" }
};

// 3. 图片压缩处理工具
export const processImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  Aperture,
  ArrowRight,
  BoxSelect,
  CheckCircle2,
  ChevronDown,
  Copy,
  Fingerprint,
  Focus,
  Globe,
  Hash,
  Layers,
  Maximize2,
  Scan,
  Sparkles,
  Target,
  Wand2,
  X,
  Zap,
  RefreshCw,
} from "lucide-react";

// =======================================================
// 配置专区：代理模式下只需要保留模型名称
// =======================================================
const ANALYZER_MODEL = "OpenGVLab/InternVL2-26B";

const LANGUAGES = [
  { id: "zh-CN", name: "🇨🇳 简体中文 (Chinese)" },
  { id: "en", name: "🇺🇸 English" },
  { id: "ja", name: "🇯🇵 日本語 (Japanese)" },
  { id: "ko", name: "🇰🇷 한국어 (Korean)" },
  { id: "fr", name: "🇫🇷 Français (French)" },
  { id: "de", name: "🇩🇪 Deutsch (German)" },
  { id: "es", name: "🇪🇸 Español (Spanish)" },
  { id: "it", name: "🇮🇹 Italiano (Italian)" },
  { id: "ru", name: "🇷🇺 Русский (Russian)" },
];

const LOG_MESSAGES = {
  "zh-CN": [
    ">> [BOOT] 初始化视觉神经通路... [OK]",
    ">> [SCAN] 锚定画面主体，正在解构像素级微表情与骨骼张力...",
    ">> [FOCUS] 局部放大：正在扫描手持物品细节、材质与物理交互...",
    ">> [OCR] 激活文字识别矩阵，穷尽式扫描画面中所有极小文字与名字标签...",
    ">> [DEPTH] 测算环境纵深，重建三维场域、背景细节与天气系统...",
    ">> [LIGHT] 逆向推演光学工程，计算色温、主光源与材质光线反射率...",
    ">> [LENS] 反推摄像机物理参数：焦距、光圈、ISO 与几何构图比例...",
    ">> [COMPILE] 所有数百项微观细节解析完毕。正在通过大模型编译终极 Master Prompt...",
    ">> [SYNC] 编译成功，正在将高维数据同步至前端显像面板...",
  ],
  en: [
    ">> [BOOT] INITIATING VISUAL NEURAL PATHWAYS... [OK]",
    ">> [SCAN] ANCHORING SUBJECT, DECONSTRUCTING MICRO-EXPRESSIONS...",
    ">> [FOCUS] MAGNIFYING: SCANNING HELD OBJECTS, MATERIALS & INTERACTIONS...",
    ">> [OCR] ACTIVATING EXHAUSTIVE TEXT RECOGNITION (TINY TEXT & NAME TAGS)...",
    ">> [DEPTH] CALCULATING ENVIRONMENTAL DEPTH & EXTREME BACKGROUND DETAILS...",
    ">> [LIGHT] REVERSE-ENGINEERING OPTICS, TEMPERATURE & REFLECTANCE...",
    ">> [LENS] EXTRACTING CAMERA PHYSICS & GEOMETRIC COMPOSITION...",
    ">> [COMPILE] HUNDREDS OF MICRO-DETAILS ANALYZED. COMPILING MASTER PROMPT...",
    ">> [SYNC] COMPILE SUCCESS. SYNCING HIGH-DIMENSIONAL DATA TO TERMINAL...",
  ],
};

const ANALYSIS_MODULES = [
  {
    id: "subjectAndDetails",
    name: "Micro-Subject & Anatomy",
    icon: Fingerprint,
  },
  {
    id: "typographyAndSymbols",
    name: "Typography & Semiotics",
    icon: Hash,
  },
  {
    id: "environmentAndDepth",
    name: "Environment & Depth",
    icon: Layers,
  },
  {
    id: "lightingAndColor",
    name: "Optical Engineering",
    icon: Zap,
  },
  {
    id: "cameraAndComposition",
    name: "Camera & Geometry",
    icon: Target,
  },
];

const STEPS_CONFIG = [
  { id: 1, title: "上传图片", subtitle: "DATA IMPORT" },
  { id: 2, title: "分析图片", subtitle: "NEURAL SCAN" },
  { id: 3, title: "生成提示词", subtitle: "PROMPT OUTPUT" },
];

function getLogMessage(progress, lang) {
  const baseLogs = LOG_MESSAGES[lang] || LOG_MESSAGES.en || LOG_MESSAGES["zh-CN"];

  if (progress < 5) return baseLogs[0];
  if (progress < 15) return baseLogs[1];
  if (progress < 30) return baseLogs[2];
  if (progress < 45) return baseLogs[3];
  if (progress < 60) return baseLogs[4];
  if (progress < 75) return baseLogs[5];
  if (progress < 88) return baseLogs[6];
  if (progress < 98) return baseLogs[7];
  return baseLogs[8];
}

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [image, setImage] = useState(null);
  const [base64Image, setBase64Image] = useState("");
  const [imageMimeType, setImageMimeType] = useState("image/png");
  const [targetLang, setTargetLang] = useState("zh-CN");

  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [logs, setLogs] = useState([]);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;

    setImageMimeType(file.type);
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") return;

      setBase64Image(result.split(",")[1]);
      setImage(result);
      setResult(null);
      setError(null);
      setProgress(0);
    };

    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event) => {
    processFile(event.target.files?.[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!image) setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!image && file) processFile(file);
  };

  useEffect(() => {
    const handlePaste = (event) => {
      if (currentStep !== 1 || image) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i += 1) {
        if (items[i].type.includes("image")) {
          processFile(items[i].getAsFile());
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [currentStep, image]);

  useEffect(() => {
    let intervalId;

    if (currentStep === 2 && progress < 100 && !result && !error) {
      intervalId = window.setInterval(() => {
        setProgress((prev) => {
          const next = prev + Math.random() * 1.5;
          return next > 99 ? 99 : next;
        });
      }, 250);
    }

    return () => window.clearInterval(intervalId);
  }, [currentStep, progress, result, error]);

  useEffect(() => {
    if (currentStep !== 2) return;

    const newLog = getLogMessage(progress, targetLang);
    setLogs((prev) => {
      if (prev.length === 0 || prev[prev.length - 1] !== newLog) {
        return [...prev.slice(-4), newLog];
      }
      return prev;
    });
  }, [progress, currentStep, targetLang]);

  const executeAnalysis = async () => {
    if (!base64Image) return;

    setCurrentStep(2);
    setProgress(0);
    setResult(null);
    setError(null);
    setLogs([]);

    const langName = LANGUAGES.find((lang) => lang.id === targetLang)?.name || "简体中文";

    try {
      const promptText = `
你是一个顶级的 AI 视觉重构引擎、Midjourney v6 首席提示词工程师、好莱坞级摄影指导（DP）和 CGI 渲染大师。你的任务是对上传的图像进行“像素级”的逆向工程，拆解出所有的视觉元素，并最终组合成一段能【完美复刻该原图风格、排版与细节】的神级提示词。

【指令协议】：无论图像内容是什么，所有的分析结果和生成的 Master Prompt 都必须强制使用【${langName}】输出。

请严格遵循以下 JSON 结构输出（字段名必须严格匹配）：
{
  "subjectAndDetails": "【主体与像素级细节】极尽详细地描述画面主体。如果是人物：描述长相特征、极其细微的神态、衣服的材质纹理、手中具体拿着的物品及握持姿势。如果是静物：描述物理纹理、老化程度。",
  "typographyAndSymbols": "【排版、文字与视觉符号】分析画面的平面设计与构图排版。1. 穷尽式提取图中所有文字。2. 描述字体风格是扁平2D还是立体3D。如果原图文字是扁平化设计的，必须强调“flat 2D typography, vector graphic text”。3. 描述文字的排版位置。",
  "environmentAndDepth": "【环境纵深与场域构建】解构物理空间。明确区分并描述前景、中景和远景。列出背景中到底有哪些具体的物件、建筑细节、路人、杂物以及天气状态。",
  "lightingAndColor": "【光学工程与色彩美学】使用顶级行业术语描述打光方案（如伦勃朗光、丁达尔效应）。提取画面的主色调、辅色调，描述色彩饱和度风格。",
  "cameraAndComposition": "【镜头语言与核心构图骨架】决定画面结构的绝对关键！1. 明确空间机位与视角（仰拍/俯拍/特写）。2. 构图法则（三分法/对称/引导线）。3. 物理镜头推演（焦距与景深）。",
  "masterPrompt": "【最高级组装公式】：[顶级画风词/媒介] + [🔥核心机位视角与构图法则] + [前4个模块的所有海量细节堆叠] + [重点强调文字的质感] + [顶级渲染引擎与画质词(如 Unreal Engine 5, Octane Render, 8k resolution)]。把前面的分析像复读机一样全部拼进去！字数必须超过 400 字！全部使用 ${langName}！"
}
`;

      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: ANALYZER_MODEL,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: promptText },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${imageMimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.error || "后端代理请求失败");
      }

      const rawText =
        data.choices?.[0]?.message?.content ||
        data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error(`Neural link severed. 拦截详情: ${JSON.stringify(data).substring(0, 150)}`);
      }

      let parsedResult;
      try {
        const cleanedText = rawText
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        parsedResult = JSON.parse(cleanedText);
      } catch (parseError) {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error(`Data format unreadable. Raw response: ${rawText.substring(0, 50)}...`);
        }
        parsedResult = JSON.parse(jsonMatch[0]);
      }

      setProgress(100);
      setResult(parsedResult);

      window.setTimeout(() => {
        setCurrentStep(3);
      }, 1200);
    } catch (err) {
      setError(`ERR_SYS: ${err.message}`);
      console.error(err);
    }
  };

  const copyPrompt = () => {
    if (!result?.masterPrompt) return;

    const fallbackCopy = (text) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        setCopySuccess(true);
        window.setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error(err);
      }

      document.body.removeChild(textArea);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(result.masterPrompt)
        .then(() => {
          setCopySuccess(true);
          window.setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(() => fallbackCopy(result.masterPrompt));
    } else {
      fallbackCopy(result.masterPrompt);
    }
  };

  const resetToHome = () => {
    setImage(null);
    setBase64Image("");
    setCurrentStep(0);
    setResult(null);
    setProgress(0);
  };

  const resetSystem = () => {
    setImage(null);
    setBase64Image("");
    setCurrentStep(1);
    setResult(null);
    setProgress(0);
  };

  const renderTopNav = () => {
    if (currentStep === 0) return null;

    return (
      <div className="absolute left-0 right-0 top-0 z-50 mx-auto flex w-full max-w-6xl justify-start px-4 pt-6">
        <button
          type="button"
          onClick={resetToHome}
          className="group flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-[#00F0FF]/30 bg-[#020617]">
            <Aperture className="text-[#00F0FF] transition-transform duration-700 group-hover:rotate-180" size={16} />
          </div>
          <span className="flex items-start text-lg font-black tracking-tighter text-white">
            VISION
            <span className="ml-1 bg-gradient-to-r from-[#00F0FF] via-blue-400 to-[#00F0FF] bg-clip-text text-transparent">
              ARCHITECT
            </span>
            <span className="ml-0.5 mt-1 text-[10px] leading-none text-[#00F0FF]">PRO</span>
          </span>
        </button>
      </div>
    );
  };

  const renderStep0 = () => (
    <div className="relative z-10 mx-auto flex min-h-[85vh] w-full max-w-5xl animate-in flex-col items-center justify-center px-4 fade-in slide-in-from-bottom-8 duration-1000">
      <div className="relative mb-16 flex w-full flex-col items-center text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00F0FF]/10 blur-[80px]" />

        <div className="group relative z-10 mb-10 inline-flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-[#00F0FF]/30 bg-[#050A15]/80 shadow-[0_0_50px_rgba(0,240,255,0.15)] backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <Aperture
            className="custom-spin-slow text-[#00F0FF] transition-transform duration-500 group-hover:scale-110"
            size={48}
            strokeWidth={1}
          />
        </div>

        <h1 className="custom-elegant-font relative z-10 mb-4 flex flex-col items-center justify-center text-5xl leading-tight tracking-normal text-white md:flex-row md:text-7xl">
          <span className="mb-2 text-[#F8FAFC] md:mb-0 md:mr-6">Vision</span>
          <span className="relative text-[#00F0FF]">
            Architect
            <span className="absolute -right-14 -top-2 font-sans text-xl font-light not-italic tracking-widest text-[#00F0FF] opacity-80 md:-top-4 md:text-3xl">
              PRO
            </span>
          </span>
        </h1>

        <p className="relative mx-auto mt-8 max-w-2xl border-t border-[#1E293B] pt-6 font-mono text-xs uppercase tracking-[0.25em] text-[#94A3B8] md:mt-12 md:text-sm">
          <span className="absolute -top-1 left-1/2 h-2 w-12 -translate-x-1/2 bg-[#020617]" />
          The ultimate neural image deconstruction engine & master prompt generator.
        </p>
      </div>

      <div className="relative z-10 mb-20 grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            icon: Fingerprint,
            title: "微观像素解构",
            desc: "穿透表层视觉，精准提取图像中的微表情、服饰材质、隐藏文字与环境场域细节。",
          },
          {
            icon: Zap,
            title: "光学参数逆推",
            desc: "运用好莱坞级摄影理论，反推原始画面的物理镜头焦距、景深、构图法则与伦勃朗光影。",
          },
          {
            icon: Wand2,
            title: "神级咒语编译",
            desc: "集成 V6 首席工程师逻辑，将数百项视觉参数完美融合，生成能100%复刻画风的史诗级提示词。",
          },
        ].map((feature, index) => (
          <div
            key={feature.title}
            className="group relative overflow-hidden rounded-xl border border-[#1E293B] bg-[#050A15]/60 p-8 shadow-xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-[#00F0FF]/50"
          >
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-bl from-[#00F0FF]/5 to-transparent blur-2xl transition-all group-hover:from-[#00F0FF]/20" />
            <div className="pointer-events-none absolute left-0 top-0 h-[2px] w-full bg-[#00F0FF]/50 opacity-0 blur-[1px] group-hover:animate-scan-image group-hover:opacity-100" />

            <feature.icon
              className="mb-6 text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)] transition-transform group-hover:scale-110"
              size={32}
              strokeWidth={1.5}
            />
            <h3 className="mb-3 text-lg font-bold tracking-widest text-white">{feature.title}</h3>
            <p className="text-xs font-light leading-relaxed text-[#64748B]">{feature.desc}</p>
          </div>
        ))}
      </div>

      <div className="relative z-10 flex w-full flex-col items-center justify-center">
        <div className="mb-8 flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-[#475569] md:text-xs">
          <span className="flex items-center gap-2">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#475569] text-[8px]">1</span>
            导入图像
          </span>
          <ArrowRight size={12} className="opacity-50" />
          <span className="flex items-center gap-2">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#475569] text-[8px]">2</span>
            神经解析
          </span>
          <ArrowRight size={12} className="opacity-50" />
          <span className="flex items-center gap-2 text-[#00F0FF] drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#00F0FF] bg-[#00F0FF]/20 text-[8px] text-[#00F0FF]">
              3
            </span>
            获取咒语
          </span>
        </div>

        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="group relative inline-flex items-center justify-center gap-4 overflow-hidden rounded-sm bg-gradient-to-r from-[#00F0FF] to-[#00D4FF] px-12 py-5 text-sm font-black uppercase tracking-[0.2em] text-[#020617] shadow-[0_0_40px_rgba(0,240,255,0.3)] transition-all duration-500 hover:from-white hover:to-white hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] md:text-lg"
        >
          <div className="absolute inset-0 h-full w-full -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shimmer" />
          <Sparkles size={22} className="relative z-10 transition-transform group-hover:rotate-12" />
          <span className="relative z-10 mt-0.5">免费反推提示词</span>
        </button>
      </div>
    </div>
  );

  const renderStepIndicator = () => {
    if (currentStep === 0) return null;

    return (
      <div className="relative z-20 mx-auto mb-16 mt-16 flex w-full max-w-4xl items-center justify-center px-4 md:mb-20">
        {STEPS_CONFIG.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              <div className="group relative flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  {isActive && (
                    <>
                      <div
                        className="absolute inset-[-10px] animate-ping rounded-full border border-[#00F0FF]/30"
                        style={{ animationDuration: "2.5s" }}
                      />
                      <div className="custom-spin-slow absolute inset-[-4px] rounded-full border border-[#00F0FF]/60 border-t-transparent" />
                    </>
                  )}
                  <div
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition-all duration-700 md:h-12 md:w-12 md:text-lg ${
                      isActive
                        ? "scale-110 bg-[#00F0FF] text-[#020617] shadow-[0_0_30px_rgba(0,240,255,0.8)]"
                        : isCompleted
                          ? "border border-[#00F0FF]/40 bg-[#00F0FF]/15 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                          : "border border-[#1E293B] bg-[#0F172A] text-[#475569]"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={20} strokeWidth={2.5} /> : step.id}
                  </div>
                </div>

                <div className="absolute left-1/2 top-[calc(100%+12px)] w-32 -translate-x-1/2 text-center">
                  <div
                    className={`text-[13px] font-bold tracking-widest transition-colors duration-500 md:text-[15px] ${
                      isActive
                        ? "text-[#00F0FF] drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                        : isCompleted
                          ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]"
                          : "text-[#475569]"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div
                    className={`mt-1 font-mono text-[8px] uppercase tracking-[0.2em] transition-colors duration-500 md:text-[9px] ${
                      isActive ? "text-[#00F0FF]/80" : "text-[#334155]"
                    }`}
                  >
                    {step.subtitle}
                  </div>
                </div>
              </div>

              {index < STEPS_CONFIG.length - 1 && (
                <div className="relative mx-2 mt-[-20px] h-[2px] max-w-[140px] flex-1 overflow-hidden rounded-full bg-[#1E293B] md:mx-6 md:mt-0">
                  <div
                    className="absolute left-0 top-0 h-full bg-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.6)] transition-all duration-1000 ease-in-out"
                    style={{ width: currentStep > index + 1 ? "100%" : "0%" }}
                  />
                  {isActive && (
                    <div className="animate-shimmer absolute left-0 top-0 h-full w-[40%] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent opacity-80" />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="relative z-10 mx-auto flex w-full max-w-4xl animate-in flex-col items-center justify-center fade-in zoom-in duration-700">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold uppercase tracking-[0.2em] text-white">Initialize Scan</h2>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#64748B]">Import Target Image</p>
      </div>

      <div
        className={`relative mx-auto flex w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-xl backdrop-blur-md transition-all duration-500 ${
          image
            ? "border border-[#00F0FF]/40 bg-[#050A15]/80 p-2 shadow-[0_0_40px_rgba(0,240,255,0.15)]"
            : isDragging
              ? "h-[320px] scale-[1.02] border-2 border-dashed border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_30px_rgba(0,240,255,0.2)]"
              : "h-[320px] cursor-pointer border border-dashed border-[#334155] bg-[#0F172A]/40 hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/5"
        }`}
        onClick={() => !image && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="absolute left-0 top-0 z-20 h-3 w-3 border-l border-t border-[#00F0FF]/60" />
        <div className="absolute right-0 top-0 z-20 h-3 w-3 border-r border-t border-[#00F0FF]/60" />
        <div className="absolute bottom-0 left-0 z-20 h-3 w-3 border-b border-l border-[#00F0FF]/60" />
        <div className="absolute bottom-0 right-0 z-20 h-3 w-3 border-b border-r border-[#00F0FF]/60" />

        {image ? (
          <div
            className="group relative flex h-[300px] w-full cursor-pointer items-center justify-center overflow-hidden rounded bg-black/50"
            onClick={(event) => {
              event.stopPropagation();
              setIsLightboxOpen(true);
            }}
          >
            <img
              src={image}
              alt="Target"
              className="z-10 h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#050A15]/60 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-mono text-xs tracking-wider text-white">
                <Maximize2 size={14} /> EXAMINE
              </div>
            </div>
            <div className="absolute right-3 top-3 z-30">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setImage(null);
                  setBase64Image("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-black/50 text-[#94A3B8] backdrop-blur-md transition-all hover:border-red-500/50 hover:text-red-400"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="pointer-events-none flex flex-col items-center justify-center space-y-4 text-center opacity-70 transition-opacity hover:opacity-100">
            <BoxSelect
              size={42}
              strokeWidth={1}
              className={`mb-2 transition-colors duration-300 ${isDragging ? "text-[#00F0FF]" : "text-[#64748B]"}`}
            />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                {isDragging ? "RELEASE TO DROP" : "Import Visual Data"}
              </h3>
              <p className="mt-2 font-mono text-[10px] leading-relaxed tracking-widest text-[#475569]">
                CLICK TO BROWSE <br /> DRAG & DROP <br /> OR PASTE (CTRL+V)
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleImageUpload}
          className="hidden"
          accept="image/*"
        />
      </div>

      <div
        className={`mt-8 flex w-full max-w-md flex-col items-center justify-center gap-4 transition-all duration-700 sm:flex-row ${
          image ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="relative z-20 flex h-[48px] flex-1 items-center rounded-none border border-[#1E293B] bg-[#050A15]/80 transition-colors hover:border-[#00F0FF]/50">
          <Globe className="pointer-events-none absolute left-3 z-10 h-4 w-4 text-[#64748B]" />
          <select
            value={targetLang}
            onChange={(event) => {
              event.stopPropagation();
              setTargetLang(event.target.value);
            }}
            onClick={(event) => event.stopPropagation()}
            className="relative z-20 h-full w-full cursor-pointer appearance-none bg-transparent py-0 pl-10 pr-10 font-mono text-[12px] tracking-wider text-[#E2E8F0] focus:outline-none"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id} className="bg-[#0F172A] text-white">
                {lang.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 z-10 h-4 w-4 text-[#475569]" />
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            executeAnalysis();
          }}
          className="group relative z-20 flex h-[48px] flex-1 items-center justify-center gap-3 border border-[#00F0FF]/50 bg-[#00F0FF]/10 px-6 text-[12px] font-bold uppercase tracking-[0.2em] text-[#00F0FF] transition-all duration-300 hover:bg-[#00F0FF]/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
        >
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#00F0FF]/20 to-transparent group-hover:animate-shimmer" />
          <Scan size={16} className="pointer-events-none relative z-10" />
          <span className="pointer-events-none relative z-10 whitespace-nowrap">INITIATE SCAN</span>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="relative z-10 mx-auto flex w-full max-w-5xl animate-in flex-col items-center justify-center fade-in duration-500">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.05]">
        <div className="custom-spin-reverse-slow h-[120%] w-[120%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDBoMXY0MEgweiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0wIDBoNDB2MUgweiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] opacity-20" />
      </div>

      <div className="relative z-10 mb-8 text-center">
        <h2 className="flex items-center justify-center gap-3 text-2xl font-black uppercase tracking-[0.3em] text-white">
          <Activity className="animate-pulse text-[#00F0FF]" /> Neural Analysis In Progress
        </h2>
        <p className="mt-2 font-mono text-xs tracking-widest text-[#00F0FF]">
          {progress >= 100 ? "DECRYPTION COMPLETE" : "DECRYPTING VISUAL DATA..."}
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-10 lg:flex-row">
        <div className="group relative h-64 w-64 overflow-hidden rounded-lg border border-[#00F0FF]/30 bg-[#050A15] p-2 shadow-[0_0_30px_rgba(0,240,255,0.1)] lg:h-80 lg:w-80">
          <img src={image} className="h-full w-full object-contain opacity-40 mix-blend-screen grayscale-[30%]" alt="Scanning" />
          <div className="pointer-events-none absolute inset-0 bg-[#00F0FF]/5" />
          <div className="custom-scan-line-image pointer-events-none absolute left-0 top-0 h-[3px] w-full bg-[#00F0FF] opacity-80 shadow-[0_0_20px_2px_#00F0FF]" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Focus className="glitch-crosshair h-24 w-24 text-[#00F0FF] opacity-50" strokeWidth={0.5} />
          </div>
          <div className="absolute bottom-2 right-2 font-mono text-[9px] text-[#00F0FF]/70">TARGET_LOCKED</div>
        </div>

        <div className="flex w-full max-w-md flex-col items-center">
          <div className="relative mb-8 flex h-48 w-48 items-center justify-center">
            <svg className="custom-spin-slow absolute inset-0 h-full w-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 4" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#00F0FF" strokeWidth="0.5" strokeDasharray="10 5" className="opacity-60" />
            </svg>
            <svg className="absolute inset-4 h-[calc(100%-32px)] w-[calc(100%-32px)] -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" stroke="#0F172A" strokeWidth="3" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="48"
                stroke="#00F0FF"
                strokeWidth="3"
                fill="none"
                strokeLinecap="square"
                className="shadow-[0_0_15px_#00F0FF] transition-all duration-300 ease-out"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={100 - Math.min(progress, 100)}
              />
            </svg>
            <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full border border-[#00F0FF]/20 bg-[#020617]">
              <div className="font-mono text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
                {Math.floor(progress)}
                <span className="ml-1 text-sm text-[#00F0FF]">%</span>
              </div>
            </div>
          </div>

          <div className="relative w-full overflow-hidden border border-[#1E293B] bg-[#050A15]/90 p-4 font-mono text-[10px] leading-relaxed shadow-2xl sm:text-[11px]">
            <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[#00F0FF]/50 to-transparent" />
            <div className="mb-2 flex justify-between border-b border-[#1E293B] pb-2 text-[#64748B]">
              <span className="uppercase tracking-widest">TERMINAL // {targetLang}</span>
              <span className="animate-pulse text-[#00F0FF]">_EXEC</span>
            </div>
            <div className="flex h-[100px] flex-col justify-end gap-1">
              {logs.map((log, index) => (
                <div
                  key={`${log}-${index}`}
                  className={`transform transition-all duration-300 ${
                    index === logs.length - 1
                      ? "translate-x-1 font-bold text-[#00F0FF] opacity-100"
                      : "text-[#475569] opacity-70"
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-3 flex items-center justify-between border border-red-500/30 bg-red-950/40 p-2 text-xs text-red-400">
                <span className="flex items-center gap-2">
                  <X size={14} /> {error}
                </span>
                <button type="button" onClick={() => setCurrentStep(1)} className="underline hover:text-white">
                  RETRY
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="relative z-10 mx-auto w-full max-w-6xl animate-in pb-20 pt-4 slide-in-from-bottom-8 duration-700">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-[#1E293B] pb-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center border border-[#00F0FF]/30 bg-[#050A15] shadow-[0_0_20px_rgba(0,240,255,0.1)]">
            <CheckCircle2 className="text-[#00F0FF]" size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-white">Analysis Complete</h2>
            <p className="mt-1 font-mono text-[10px] tracking-widest text-[#00F0FF]">5-DIMENSIONAL DATA MATRICES EXTRACTED</p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetSystem}
          className="flex items-center gap-2 whitespace-nowrap rounded-sm border border-[#00F0FF]/40 bg-[#00F0FF]/10 px-6 py-3 text-[12px] font-bold uppercase tracking-widest text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all hover:border-[#00F0FF] hover:bg-[#00F0FF]/20 hover:text-white"
        >
          <RefreshCw size={16} /> 返回重新分析
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <div className="sticky top-6 border border-[#1E293B] bg-[#050A15]/60 p-2">
            <div className="mb-2 flex justify-between px-1 font-mono text-[9px] tracking-widest text-[#64748B]">
              <span>SOURCE_FILE</span>
              <span className="text-[#00F0FF]">VERIFIED</span>
            </div>
            <div
              className="group relative flex cursor-pointer items-center justify-center overflow-hidden border border-[#1E293B] bg-black"
              onClick={() => setIsLightboxOpen(true)}
            >
              <img src={image} alt="Original" className="max-h-[350px] w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
              <div className="absolute inset-0 flex items-center justify-center bg-[#00F0FF]/20 opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2 className="text-white drop-shadow-lg" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-9">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {ANALYSIS_MODULES.map((module, index) => (
              <div
                key={module.id}
                className={`cyber-card-reveal group relative overflow-hidden border border-[#1E293B] bg-gradient-to-br from-[#050A15] to-[#020617] p-5 shadow-lg transition-colors hover:border-[#00F0FF]/40 ${
                  index === 4 ? "md:col-span-2" : ""
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-[#1E293B] transition-all duration-300 group-hover:bg-[#00F0FF] group-hover:shadow-[0_0_15px_#00F0FF]" />
                <div className="absolute right-0 top-0 m-1 h-4 w-4 border-r border-t border-[#334155] opacity-50 group-hover:border-[#00F0FF]" />
                <div className="absolute bottom-0 left-0 m-1 ml-2 h-4 w-4 border-b border-l border-[#334155] opacity-50 group-hover:border-[#00F0FF]" />
                <div className="pointer-events-none absolute left-0 top-0 h-[2px] w-full bg-[#00F0FF]/50 opacity-0 blur-[1px] group-hover:animate-scan-image group-hover:opacity-100" />
                <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] opacity-5" />

                <div className="relative z-10 mb-4 flex items-center justify-between border-b border-[#1E293B] pb-3 pl-2">
                  <div className="flex items-center gap-3">
                    <module.icon size={16} className="text-[#00F0FF]" strokeWidth={1.5} />
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#94A3B8] transition-colors group-hover:text-white">
                      {module.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10B981] shadow-[0_0_5px_#10B981]" />
                    <span className="hidden font-mono text-[8px] tracking-widest text-[#475569] sm:inline-block">SYNCED</span>
                  </div>
                </div>

                <div className="relative z-10 pl-2">
                  <p className="flex-1 break-words text-[13px] font-light leading-relaxed tracking-wide text-[#E2E8F0]">
                    {result?.[module.id] || "No data extracted for this dimension."}
                    <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-[#00F0FF] align-middle opacity-0 group-hover:opacity-80" />
                  </p>
                </div>

                <div className="absolute bottom-2 right-2 flex items-end gap-[1px] opacity-20">
                  <div className="h-3 w-[1px] bg-white" />
                  <div className="h-4 w-[2px] bg-white" />
                  <div className="h-2 w-[1px] bg-white" />
                  <div className="h-4 w-[3px] bg-white" />
                  <div className="h-3 w-[1px] bg-white" />
                </div>
              </div>
            ))}
          </div>

          <div
            className="cyber-card-reveal relative mt-10 overflow-hidden border border-[#00F0FF]/30 bg-[#020617] shadow-[0_0_40px_rgba(0,240,255,0.05)]"
            style={{ animationDelay: "800ms" }}
          >
            <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent" />
            <div className="flex flex-col items-start justify-between gap-4 border-b border-[#1E293B] bg-[#050A15] px-6 py-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <Zap size={18} className="text-[#00F0FF]" fill="#00F0FF" fillOpacity={0.2} />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-white drop-shadow-[0_0_8px_rgba(0,240,255,0.3)]">
                    Master Prompt Engine
                  </h3>
                  <p className="mt-1 font-mono text-[9px] tracking-widest text-[#64748B]">OPTIMIZED FOR V6 & SDXL ARCHITECTURE</p>
                </div>
              </div>

              <button
                type="button"
                onClick={copyPrompt}
                className={`flex items-center gap-2 border px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                  copySuccess
                    ? "border-[#10B981]/50 bg-[#10B981]/10 text-[#10B981]"
                    : "border-[#00F0FF]/30 bg-[#00F0FF]/5 text-[#00F0FF] hover:border-[#00F0FF] hover:bg-[#00F0FF]/20"
                }`}
              >
                {copySuccess ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copySuccess ? "PROMPT COPIED" : "COPY MASTER PROMPT"}
              </button>
            </div>

            <div className="flex">
              <div className="flex w-10 select-none flex-col items-center border-r border-[#1E293B] bg-[#020617] py-6 font-mono text-[9px] opacity-40">
                {Array.from({ length: 8 }, (_, index) => (
                  <span key={index} className="mb-7 text-[#64748B]">
                    {index + 1}
                  </span>
                ))}
              </div>
              <div className="group relative flex-1 bg-[#020617] p-6">
                <p className="whitespace-pre-wrap text-[13px] font-light leading-[2.2] tracking-wide text-[#E2E8F0] selection:bg-[#00F0FF]/30 md:text-[14px]">
                  {result?.masterPrompt}
                  <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-[#00F0FF] align-middle opacity-0 group-hover:opacity-100" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Lightbox = () => {
    if (!isLightboxOpen || !image) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/90 p-4 backdrop-blur-xl fade-in duration-300 md:p-8"
        onClick={() => setIsLightboxOpen(false)}
      >
        <button
          type="button"
          className="absolute right-6 top-6 text-white/50 transition-colors hover:text-white"
          onClick={() => setIsLightboxOpen(false)}
        >
          <X size={32} strokeWidth={1} />
        </button>
        <img
          src={image}
          alt="Enlarged Target"
          className="max-h-full max-w-full animate-in border border-white/10 object-contain shadow-2xl zoom-in-95 duration-500"
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start overflow-x-hidden bg-[#020617] pb-8 pt-4 font-sans text-[#E2E8F0]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,900&display=swap');

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #020617; }
        ::-webkit-scrollbar-thumb { background: #1E293B; }
        ::-webkit-scrollbar-thumb:hover { background: #00F0FF; }

        .custom-elegant-font {
          font-family: 'Playfair Display', serif;
          font-style: italic;
        }

        .custom-spin-slow { animation: spin 15s linear infinite; }
        .custom-spin-reverse-slow { animation: spin 20s linear infinite reverse; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-shimmer { animation: shimmer 2.5s infinite linear; }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .custom-scan-line-image {
          animation: scanImage 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes scanImage {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .glitch-crosshair { animation: crosshairGlitch 4s infinite; }

        @keyframes crosshairGlitch {
          0%, 90% { opacity: 0.5; transform: scale(1); }
          92% { opacity: 0.8; transform: scale(1.1); }
          94% { opacity: 0.2; transform: scale(0.95); }
          96% { opacity: 0.9; transform: scale(1.05); }
          100% { opacity: 0.5; transform: scale(1); }
        }

        .cyber-card-reveal {
          animation: cardReveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        @keyframes cardReveal {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 240, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />
      <div className="pointer-events-none fixed right-[-10%] top-[-20%] z-0 h-[60vw] w-[60vw] rounded-full bg-[#00F0FF]/10 blur-[150px]" />

      {renderTopNav()}
      {renderStepIndicator()}

      <div className="mt-4 flex w-full flex-1 flex-col items-center justify-center">
        {currentStep === 0 && renderStep0()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      <Lightbox />
    </div>
  );
}

export default App;

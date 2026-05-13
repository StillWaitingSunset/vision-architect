import React, { useState, useRef, useEffect } from 'react';
import { 
  Scan, 
  Globe, 
  Copy, 
  CheckCircle2, 
  X, 
  Activity,
  Zap,
  Target,
  Layers,
  Hash,
  Aperture,
  ChevronDown,
  RefreshCw,
  Focus,
  Maximize2,
  BoxSelect,
  Fingerprint,
  Sparkles,
  Wand2,
  ArrowRight,
} from 'lucide-react';

// =======================================================
// 【NEW API 配置专区】 - 部署到外部时请务必填写这里
// =======================================================

const ANALYZER_MODEL = "Qwen/Qwen2-VL-72B-Instruct"; 
// =======================================================

const LANGUAGES = [
  { id: 'zh-CN', name: '🇨🇳 简体中文 (Chinese)' },
  { id: 'en', name: '🇺🇸 English' },
  { id: 'ja', name: '🇯🇵 日本語 (Japanese)' },
  { id: 'ko', name: '🇰🇷 한국어 (Korean)' },
  { id: 'fr', name: '🇫🇷 Français (French)' },
  { id: 'de', name: '🇩🇪 Deutsch (German)' },
  { id: 'es', name: '🇪🇸 Español (Spanish)' },
  { id: 'it', name: '🇮🇹 Italiano (Italian)' },
  { id: 'ru', name: '🇷🇺 Русский (Russian)' }
];

const LOG_MESSAGES = {
  'zh-CN': [
    ">> [BOOT] 初始化视觉神经通路... [OK]",
    ">> [SCAN] 锚定画面主体，正在解构像素级微表情与骨骼张力...",
    ">> [FOCUS] 局部放大：正在扫描手持物品细节、材质与物理交互...",
    ">> [OCR] 激活文字识别矩阵，穷尽式扫描画面中所有极小文字与名字标签...",
    ">> [DEPTH] 测算环境纵深，重建三维场域、背景细节与天气系统...",
    ">> [LIGHT] 逆向推演光学工程，计算色温、主光源与材质光线反射率...",
    ">> [LENS] 反推摄像机物理参数：焦距、光圈、ISO 与几何构图比例...",
    ">> [COMPILE] 所有数百项微观细节解析完毕。正在通过大模型编译终极 Master Prompt...",
    ">> [SYNC] 编译成功，正在将高维数据同步至前端显像面板..."
  ],
  'en': [
    ">> [BOOT] INITIATING VISUAL NEURAL PATHWAYS... [OK]",
    ">> [SCAN] ANCHORING SUBJECT, DECONSTRUCTING MICRO-EXPRESSIONS...",
    ">> [FOCUS] MAGNIFYING: SCANNING HELD OBJECTS, MATERIALS & INTERACTIONS...",
    ">> [OCR] ACTIVATING EXHAUSTIVE TEXT RECOGNITION (TINY TEXT & NAME TAGS)...",
    ">> [DEPTH] CALCULATING ENVIRONMENTAL DEPTH & EXTREME BACKGROUND DETAILS...",
    ">> [LIGHT] REVERSE-ENGINEERING OPTICS, TEMPERATURE & REFLECTANCE...",
    ">> [LENS] EXTRACTING CAMERA PHYSICS & GEOMETRIC COMPOSITION...",
    ">> [COMPILE] HUNDREDS OF MICRO-DETAILS ANALYZED. COMPILING MASTER PROMPT...",
    ">> [SYNC] COMPILE SUCCESS. SYNCING HIGH-DIMENSIONAL DATA TO TERMINAL..."
  ]
};

const ANALYSIS_MODULES = [
  { id: 'subjectAndDetails', name: 'Micro-Subject & Anatomy', desc: '微观主体与人物解析', icon: Fingerprint },
  { id: 'typographyAndSymbols', name: 'Typography & Semiotics', desc: '文字提取与符号解码', icon: Hash },
  { id: 'environmentAndDepth', name: 'Environment & Depth', desc: '环境纵深与场域', icon: Layers },
  { id: 'lightingAndColor', name: 'Optical Engineering', desc: '光学工程与色彩图谱', icon: Zap },
  { id: 'cameraAndComposition', name: 'Camera & Geometry', desc: '摄影机参数与空间几何', icon: Target }
];

const STEPS_CONFIG = [
  { id: 1, title: '上传图片', subtitle: 'DATA IMPORT' },
  { id: 2, title: '分析图片', subtitle: 'NEURAL SCAN' },
  { id: 3, title: '生成提示词', subtitle: 'PROMPT OUTPUT' }
];

const App = () => {
  // 状态 0: 封面页 (Landing), 1: 上传, 2: 分析, 3: 结果
  const [currentStep, setCurrentStep] = useState(0); 
  const [image, setImage] = useState(null);
  const [base64Image, setBase64Image] = useState("");
  const [imageMimeType, setImageMimeType] = useState("image/png");
  const [targetLang, setTargetLang] = useState('zh-CN');
  
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [logs, setLogs] = useState([]);
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImageMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result.split(',')[1]);
        setImage(reader.result);
        setResult(null);
        setError(null);
        setProgress(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e) => processFile(e.target.files[0]);
  const handleDragOver = (e) => { e.preventDefault(); if (!image) setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!image && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    const handlePaste = (e) => {
      if (currentStep !== 1 || image) return; 
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            processFile(items[i].getAsFile());
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [currentStep, image]);

  const getLogMessage = (prog, lang) => {
    const baseLogs = LOG_MESSAGES[lang] || LOG_MESSAGES['en'] || LOG_MESSAGES['zh-CN'];
    if (prog < 5) return baseLogs[0];
    if (prog < 15) return baseLogs[1];
    if (prog < 30) return baseLogs[2];
    if (prog < 45) return baseLogs[3];
    if (prog < 60) return baseLogs[4];
    if (prog < 75) return baseLogs[5];
    if (prog < 88) return baseLogs[6];
    if (prog < 98) return baseLogs[7];
    return baseLogs[8];
  };

  useEffect(() => {
    let interval;
    if (currentStep === 2 && progress < 100 && !result && !error) {
      interval = setInterval(() => {
        setProgress(prev => {
          let next = prev + (Math.random() * 1.5);
          if (next > 99) return 99; // 锁死在99，等待结果返回才100
          return next;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [currentStep, progress, result, error]);

  useEffect(() => {
    if (currentStep === 2) {
      const newLog = getLogMessage(progress, targetLang);
      setLogs(prev => {
        if (prev.length === 0 || prev[prev.length - 1] !== newLog) {
          return [...prev.slice(-4), newLog]; 
        }
        return prev;
      });
    }
  }, [progress, currentStep, targetLang]);

  const executeAnalysis = async () => {
    if (!base64Image) return;
    
    setCurrentStep(2);
    setProgress(0);
    setResult(null);
    setError(null);
    setLogs([]);

    const langName = LANGUAGES.find(l => l.id === targetLang).name;

    try {
     const executeAnalysis = async () => {
    if (!base64Image) return;
    
    setCurrentStep(2);
    setProgress(0);
    setResult(null);
    setError(null);
    setLogs([]);

    const langName = LANGUAGES.find(l => l.id === targetLang).name;

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

      let response;
      let rawText = "";

      // 彻底干掉旧的逻辑，只保留纯净的后端代理请求
      response = await fetch('/api', { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: ANALYZER_MODEL,
          response_format: { type: "json_object" },
          messages: [{
            role: "user",
            content: [
              { type: "text", text: promptText },
              { type: "image_url", image_url: { url: `data:${imageMimeType};base64,${base64Image}` } }
            ]
          }]
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || data.error || "后端代理请求失败");
      
      // 兼容两种返回格式
      rawText = data.choices?.[0]?.message?.content || data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawText) {
        let parsedResult;
        try {
          let cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsedResult = JSON.parse(cleanedText);
        } catch (parseError) {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error(`Data format unreadable. Raw response: ${rawText.substring(0, 50)}...`);
          }
        }
        
        setProgress(100);
        setResult(parsedResult);
        
        setTimeout(() => {
          setCurrentStep(3);
        }, 1200);

      } else {
        throw new Error("Neural link severed. No valid data returned.");
      }
    } catch (err) {
      setError(`ERR_SYS: ${err.message}`);
      console.error(err);
    }
  };

      } else {
        throw new Error("Neural link severed. No valid data returned.");
      }
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
      try { document.execCommand('copy'); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); } catch (err) {}
      document.body.removeChild(textArea);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(result.masterPrompt)
        .then(() => { setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); })
        .catch(() => fallbackCopy(result.masterPrompt));
    } else {
      fallbackCopy(result.masterPrompt);
    }
  };

  // 全局重置，带你回到封面页
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

  // ================= VIEW: TOP NAVIGATION LOGO =================
  const renderTopNav = () => {
    if (currentStep === 0) return null; // 封面页不需要顶部返回 Logo
    return (
      <div className="w-full max-w-6xl mx-auto flex justify-start pt-6 px-4 absolute top-0 left-0 right-0 z-50">
        <button 
          onClick={resetToHome}
          className="group flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-[#020617] border border-[#00F0FF]/30 flex items-center justify-center relative overflow-hidden">
            <Aperture className="text-[#00F0FF] group-hover:rotate-180 transition-transform duration-700" size={16} />
          </div>
          <span className="text-lg font-black tracking-tighter text-white flex items-start">
            VISION <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-blue-400 to-[#00F0FF] ml-1">ARCHITECT</span>
            <span className="text-[#00F0FF] text-[10px] ml-0.5 leading-none mt-1">PRO</span>
          </span>
        </button>
      </div>
    );
  };

  // ================= VIEW: STEP 0 (LANDING / COVER PAGE) =================
  const renderStep0 = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-5xl mx-auto w-full relative z-10 px-4">
      
      {/* 极客风头部，完美复刻字体排版 */}
      <div className="text-center mb-16 relative w-full flex flex-col items-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#00F0FF]/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
        
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-[#050A15]/80 backdrop-blur-md border border-[#00F0FF]/30 shadow-[0_0_50px_rgba(0,240,255,0.15)] mb-10 relative z-10 group overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
           <Aperture className="text-[#00F0FF] custom-spin-slow group-hover:scale-110 transition-transform duration-500" size={48} strokeWidth={1} />
        </div>

        {/* 注入 Google Fonts 花体字 (Playfair Display) 打造复古高级感 */}
        <div dangerouslySetInnerHTML={{__html: `
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,900&display=swap');
            .custom-elegant-font {
              font-family: 'Playfair Display', serif;
              font-style: italic;
            }
          </style>
        `}} />

        {/* 极简、扁平化的现代科技感与复古花体字的碰撞 */}
        <h1 className="text-5xl md:text-7xl custom-elegant-font text-white relative z-10 mb-4 flex flex-col md:flex-row items-center justify-center leading-tight tracking-normal">
          <span className="mb-2 md:mb-0 md:mr-6 text-[#F8FAFC]">Vision</span>
          <span className="text-[#00F0FF] relative">
            Architect
            <span className="absolute -top-2 md:-top-4 -right-14 text-[#00F0FF] text-xl md:text-3xl font-sans font-light not-italic tracking-widest opacity-80">PRO</span>
          </span>
        </h1>
        
        <p className="text-[#94A3B8] text-xs md:text-sm font-mono tracking-[0.25em] uppercase mt-8 md:mt-12 max-w-2xl mx-auto border-t border-[#1E293B] pt-6 relative">
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-2 bg-[#020617]"></span>
          The ultimate neural image deconstruction engine & master prompt generator.
        </p>
      </div>

      {/* 核心功能介绍流 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-20 relative z-10">
        {[
          { icon: Fingerprint, title: "微观像素解构", desc: "穿透表层视觉，精准提取图像中的微表情、服饰材质、隐藏文字与环境场域细节。" },
          { icon: Zap, title: "光学参数逆推", desc: "运用好莱坞级摄影理论，反推原始画面的物理镜头焦距、景深、构图法则与伦勃朗光影。" },
          { icon: Wand2, title: "神级咒语编译", desc: "集成 V6 首席工程师逻辑，将数百项视觉参数完美融合，生成能100%复刻画风的史诗级提示词。" }
        ].map((feat, idx) => (
          <div key={idx} className="bg-[#050A15]/60 backdrop-blur-md border border-[#1E293B] hover:border-[#00F0FF]/50 p-8 rounded-xl transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00F0FF]/5 to-transparent rounded-full blur-2xl group-hover:from-[#00F0FF]/20 transition-all"></div>
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00F0FF]/50 opacity-0 group-hover:opacity-100 group-hover:animate-scan-image pointer-events-none blur-[1px]"></div>
            
            <feat.icon className="text-[#00F0FF] mb-6 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)] group-hover:scale-110 transition-transform" size={32} strokeWidth={1.5} />
            <h3 className="text-white font-bold text-lg mb-3 tracking-widest">{feat.title}</h3>
            <p className="text-[#64748B] text-xs leading-relaxed font-light">{feat.desc}</p>
          </div>
        ))}
      </div>

      {/* 工作流指示器与主按钮 */}
      <div className="flex flex-col items-center justify-center relative z-10 w-full">
        <div className="flex items-center gap-4 text-[10px] md:text-xs font-mono text-[#475569] mb-8 tracking-widest uppercase">
          <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-[#475569] flex items-center justify-center text-[8px]">1</div> 导入图像</span> 
          <ArrowRight size={12} className="opacity-50" />
          <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-[#475569] flex items-center justify-center text-[8px]">2</div> 神经解析</span> 
          <ArrowRight size={12} className="opacity-50" />
          <span className="text-[#00F0FF] flex items-center gap-2 drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]"><div className="w-4 h-4 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF] flex items-center justify-center text-[8px] text-[#00F0FF]">3</div> 获取咒语</span>
        </div>

        <button 
          onClick={() => setCurrentStep(1)}
          className="group relative inline-flex items-center justify-center gap-4 px-12 py-5 text-sm md:text-lg font-black text-[#020617] uppercase tracking-[0.2em] bg-gradient-to-r from-[#00F0FF] to-[#00D4FF] hover:from-white hover:to-white transition-all duration-500 shadow-[0_0_40px_rgba(0,240,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] rounded-sm overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
          <Sparkles size={22} className="relative z-10 group-hover:rotate-12 transition-transform" />
          <span className="relative z-10 mt-0.5">免费反推提示词</span>
        </button>
      </div>
    </div>
  );

  // ================= VIEW: STEP INDICATOR (TOP PROGRESS BAR) =================
  const renderStepIndicator = () => {
    if (currentStep === 0) return null; // 封面不显示横向进度条

    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center mb-16 md:mb-20 relative z-20 mt-16 px-4">
        {STEPS_CONFIG.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center relative group">
                <div className="relative flex items-center justify-center">
                  {isActive && (
                    <>
                      <div className="absolute inset-[-10px] rounded-full border border-[#00F0FF]/30 animate-ping" style={{ animationDuration: '2.5s' }}></div>
                      <div className="absolute inset-[-4px] rounded-full border border-[#00F0FF]/60 border-t-transparent custom-spin-slow"></div>
                    </>
                  )}
                  <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-sm md:text-lg transition-all duration-700 z-10 
                    ${isActive ? 'bg-[#00F0FF] text-[#020617] shadow-[0_0_30px_rgba(0,240,255,0.8)] scale-110' :
                      isCompleted ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]' :
                      'bg-[#0F172A] text-[#475569] border border-[#1E293B]'}`}>
                    {isCompleted ? <CheckCircle2 size={20} strokeWidth={2.5} /> : step.id}
                  </div>
                </div>
                <div className="text-center absolute top-[calc(100%+12px)] w-32 left-1/2 -translate-x-1/2">
                  <div className={`text-[13px] md:text-[15px] font-bold tracking-widest transition-colors duration-500
                    ${isActive ? 'text-[#00F0FF] drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' :
                      isCompleted ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' :
                      'text-[#475569]'}`}>
                    {step.title}
                  </div>
                  <div className={`text-[8px] md:text-[9px] font-mono tracking-[0.2em] uppercase mt-1 transition-colors duration-500
                    ${isActive ? 'text-[#00F0FF]/80' : 'text-[#334155]'}`}>
                    {step.subtitle}
                  </div>
                </div>
              </div>
              {index < STEPS_CONFIG.length - 1 && (
                <div className="flex-1 max-w-[140px] mx-2 md:mx-6 relative h-[2px] bg-[#1E293B] rounded-full overflow-hidden mt-[-20px] md:mt-0">
                  <div 
                    className="absolute top-0 left-0 h-full bg-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.6)] transition-all duration-1000 ease-in-out"
                    style={{ width: currentStep > index + 1 ? '100%' : '0%' }}
                  ></div>
                  {isActive && (
                    <div className="absolute top-0 left-0 h-full w-[40%] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent animate-shimmer opacity-80"></div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ================= VIEW: STEP 1 (UPLOAD) =================
  const renderStep1 = () => (
    <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 max-w-4xl mx-auto w-full relative z-10">
      
      {/* 去掉原来的大标题，保持清爽 */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-[0.2em] text-white uppercase">Initialize Scan</h2>
        <p className="text-[#64748B] text-[10px] font-mono tracking-[0.3em] uppercase mt-2">Import Target Image</p>
      </div>

      <div 
        className={`relative w-full max-w-md mx-auto rounded-xl overflow-hidden transition-all duration-500 flex flex-col items-center justify-center backdrop-blur-md 
          ${image ? 'bg-[#050A15]/80 border border-[#00F0FF]/40 shadow-[0_0_40px_rgba(0,240,255,0.15)] p-2' : 
            isDragging ? 'bg-[#00F0FF]/10 border-2 border-dashed border-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.2)] h-[320px] scale-[1.02]' : 
            'bg-[#0F172A]/40 border border-dashed border-[#334155] hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/5 cursor-pointer h-[320px]'}`}
        onClick={() => !image && fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#00F0FF]/60 z-20"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#00F0FF]/60 z-20"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#00F0FF]/60 z-20"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#00F0FF]/60 z-20"></div>

        {image ? (
          <div 
            className="relative group w-full h-[300px] flex justify-center items-center overflow-hidden rounded bg-black/50 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
          >
            <img src={image} alt="Target" className="w-full h-full object-contain z-10 transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-[#050A15]/60 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
              <div className="flex items-center gap-2 text-white bg-white/10 px-4 py-2 rounded-full font-mono text-xs tracking-wider border border-white/20">
                <Maximize2 size={14} /> EXAMINE
              </div>
            </div>
            <div className="absolute top-3 right-3 z-30">
              <button 
                onClick={(e) => { e.stopPropagation(); setImage(null); setBase64Image(""); }}
                className="w-8 h-8 flex items-center justify-center bg-black/50 text-[#94A3B8] hover:text-red-400 border border-white/10 hover:border-red-500/50 rounded transition-all backdrop-blur-md"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center flex flex-col items-center justify-center space-y-4 opacity-70 hover:opacity-100 transition-opacity pointer-events-none">
            <BoxSelect size={42} strokeWidth={1} className={`mb-2 transition-colors duration-300 ${isDragging ? 'text-[#00F0FF]' : 'text-[#64748B]'}`} />
            <div>
              <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase">
                {isDragging ? 'RELEASE TO DROP' : 'Import Visual Data'}
              </h3>
              <p className="text-[10px] font-mono text-[#475569] mt-2 tracking-widest leading-relaxed">
                CLICK TO BROWSE <br/> DRAG & DROP <br/> OR PASTE (CTRL+V)
              </p>
            </div>
          </div>
        )}
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
      </div>

      <div className={`mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 w-full max-w-md ${image ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="relative flex items-center bg-[#050A15]/80 rounded-none border border-[#1E293B] hover:border-[#00F0FF]/50 transition-colors h-[48px] flex-1 z-20">
          <Globe className="absolute left-3 w-4 h-4 text-[#64748B] pointer-events-none z-10" />
          <select 
            value={targetLang}
            onChange={(e) => { e.stopPropagation(); setTargetLang(e.target.value); }}
            onClick={(e) => e.stopPropagation()}
            className="appearance-none bg-transparent pl-10 pr-10 py-0 h-full w-full text-[12px] font-mono tracking-wider text-[#E2E8F0] focus:outline-none cursor-pointer relative z-20"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id} className="bg-[#0F172A] text-white">{lang.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 w-4 h-4 pointer-events-none text-[#475569] z-10" />
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); executeAnalysis(); }}
          className="relative h-[48px] px-6 text-[12px] font-bold tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-3 bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/50 hover:bg-[#00F0FF]/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] group flex-1 z-20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00F0FF]/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
          <Scan size={16} className="relative z-10 pointer-events-none" />
          <span className="relative z-10 whitespace-nowrap pointer-events-none">INITIATE SCAN</span>
        </button>
      </div>
    </div>
  );

  // ================= VIEW: STEP 2 (ANALYZING) =================
  const renderStep2 = () => (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto relative z-10 animate-in fade-in duration-500">
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] flex items-center justify-center overflow-hidden">
        <div className="w-[120%] h-[120%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDBoMXY0MEgweiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0wIDBoNDB2MUgweiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] opacity-20 custom-spin-reverse-slow"></div>
      </div>
      <div className="text-center mb-8 relative z-10">
        <h2 className="text-2xl font-black tracking-[0.3em] text-white uppercase flex items-center justify-center gap-3">
          <Activity className="text-[#00F0FF] animate-pulse" /> Neural Analysis In Progress
        </h2>
        <p className="text-[#00F0FF] text-xs font-mono tracking-widest mt-2">{progress >= 100 ? "DECRYPTION COMPLETE" : "DECRYPTING VISUAL DATA..."}</p>
      </div>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-10 w-full">
        <div className="relative w-64 h-64 lg:w-80 lg:h-80 border border-[#00F0FF]/30 bg-[#050A15] p-2 rounded-lg shadow-[0_0_30px_rgba(0,240,255,0.1)] overflow-hidden group">
          <img src={image} className="w-full h-full object-contain opacity-40 grayscale-[30%] mix-blend-screen" alt="Scanning" />
          <div className="absolute inset-0 bg-[#00F0FF]/5 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-[3px] bg-[#00F0FF] shadow-[0_0_20px_2px_#00F0FF] custom-scan-line-image opacity-80 pointer-events-none"></div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Focus className="text-[#00F0FF] opacity-50 w-24 h-24 glitch-crosshair" strokeWidth={0.5} />
          </div>
          <div className="absolute bottom-2 right-2 text-[9px] font-mono text-[#00F0FF]/70">TARGET_LOCKED</div>
        </div>
        <div className="flex flex-col items-center w-full max-w-md">
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            <svg className="absolute inset-0 w-full h-full custom-spin-slow" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 4" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#00F0FF" strokeWidth="0.5" strokeDasharray="10 5" className="opacity-60" />
            </svg>
            <svg className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)] transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" stroke="#0F172A" strokeWidth="3" fill="none" />
              <circle 
                cx="50" cy="50" r="48" stroke="#00F0FF" strokeWidth="3" fill="none" strokeLinecap="square"
                className="transition-all duration-300 ease-out shadow-[0_0_15px_#00F0FF]" 
                pathLength="100" strokeDasharray="100" strokeDashoffset={100 - Math.min(progress, 100)} 
              />
            </svg>
            <div className="absolute inset-8 bg-[#020617] rounded-full border border-[#00F0FF]/20 flex flex-col items-center justify-center">
              <div className="text-3xl font-black font-mono text-white tracking-tighter drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
                {Math.floor(progress)}<span className="text-sm text-[#00F0FF] ml-1">%</span>
              </div>
            </div>
          </div>
          <div className="w-full bg-[#050A15]/90 border border-[#1E293B] p-4 font-mono text-[10px] sm:text-[11px] leading-relaxed shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00F0FF]/50 to-transparent"></div>
            <div className="flex justify-between text-[#64748B] mb-2 border-b border-[#1E293B] pb-2">
              <span className="uppercase tracking-widest">TERMINAL // {targetLang}</span>
              <span className="animate-pulse text-[#00F0FF]">_EXEC</span>
            </div>
            <div className="h-[100px] flex flex-col justify-end gap-1">
              {logs.map((log, i) => (
                <div key={i} className={`transition-all duration-300 transform ${i === logs.length - 1 ? 'text-[#00F0FF] font-bold translate-x-1 opacity-100' : 'text-[#475569] opacity-70'}`}>
                  {log}
                </div>
              ))}
            </div>
            {error && (
              <div className="mt-3 p-2 bg-red-950/40 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
                <span className="flex items-center gap-2"><X size={14} /> {error}</span>
                <button onClick={() => setCurrentStep(1)} className="underline hover:text-white">RETRY</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ================= VIEW: STEP 3 (RESULTS) =================
  const renderStep3 = () => (
    <div className="w-full max-w-6xl mx-auto pb-20 pt-4 animate-in slide-in-from-bottom-8 duration-700 relative z-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-[#1E293B] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#050A15] border border-[#00F0FF]/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.1)]">
            <CheckCircle2 className="text-[#00F0FF]" size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-[0.2em] text-white uppercase">Analysis Complete</h2>
            <p className="text-[10px] font-mono text-[#00F0FF] mt-1 tracking-widest">5-DIMENSIONAL DATA MATRICES EXTRACTED</p>
          </div>
        </div>
        <button onClick={resetSystem} className="flex items-center gap-2 text-[#00F0FF] hover:text-white text-[12px] font-bold tracking-widest border border-[#00F0FF]/40 hover:border-[#00F0FF] px-6 py-3 transition-all bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 uppercase shadow-[0_0_15px_rgba(0,240,255,0.15)] rounded-sm whitespace-nowrap">
          <RefreshCw size={16} /> 返回重新分析
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-[#050A15]/60 border border-[#1E293B] p-2 sticky top-6">
            <div className="text-[9px] font-mono text-[#64748B] mb-2 px-1 flex items-center justify-between tracking-widest">
              <span>SOURCE_FILE</span>
              <span className="text-[#00F0FF]">VERIFIED</span>
            </div>
            <div className="border border-[#1E293B] overflow-hidden bg-black flex items-center justify-center relative group cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
              <img src={image} alt="Original" className="w-full object-cover max-h-[350px] opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-[#00F0FF]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="text-white drop-shadow-lg" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ANALYSIS_MODULES.map((mod, idx) => (
              <div key={mod.id} className={`cyber-card-reveal bg-gradient-to-br from-[#050A15] to-[#020617] border border-[#1E293B] p-5 relative overflow-hidden group hover:border-[#00F0FF]/40 transition-colors shadow-lg ${idx === 4 ? 'md:col-span-2' : ''}`} style={{ animationDelay: `${idx * 150}ms` }}>
                {/* 装饰性边角与发光条 */}
                <div className="absolute top-0 left-0 w-1 h-full bg-[#1E293B] group-hover:bg-[#00F0FF] group-hover:shadow-[0_0_15px_#00F0FF] transition-all duration-300"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#334155] group-hover:border-[#00F0FF] opacity-50 m-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#334155] group-hover:border-[#00F0FF] opacity-50 m-1 ml-2"></div>
                
                {/* 悬停雷达扫描线 */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00F0FF]/50 opacity-0 group-hover:opacity-100 group-hover:animate-scan-image pointer-events-none blur-[1px]"></div>

                {/* 点阵背景 */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]"></div>

                <div className="flex items-center justify-between mb-4 border-b border-[#1E293B] pb-3 relative z-10 pl-2">
                  <div className="flex items-center gap-3">
                    <mod.icon size={16} className="text-[#00F0FF]" strokeWidth={1.5} />
                    <div>
                      <h4 className="text-[10px] font-bold tracking-[0.3em] text-[#94A3B8] uppercase group-hover:text-white transition-colors">{mod.name}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_5px_#10B981]"></span>
                    <span className="text-[8px] font-mono text-[#475569] tracking-widest hidden sm:inline-block">SYNCED</span>
                  </div>
                </div>
                <div className="relative z-10 pl-2">
                  <p className="text-[13px] leading-relaxed text-[#E2E8F0] font-light tracking-wide flex-1 break-words">
                    {result?.[mod.id] || "No data extracted for this dimension."}
                    <span className="inline-block w-1.5 h-3.5 bg-[#00F0FF] ml-1 opacity-0 group-hover:opacity-80 animate-pulse align-middle"></span>
                  </p>
                </div>
                
                {/* 伪装条形码 */}
                <div className="absolute bottom-2 right-2 flex items-end gap-[1px] opacity-20">
                  <div className="w-[1px] h-3 bg-white"></div><div className="w-[2px] h-4 bg-white"></div><div className="w-[1px] h-2 bg-white"></div><div className="w-[3px] h-4 bg-white"></div><div className="w-[1px] h-3 bg-white"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="cyber-card-reveal bg-[#020617] border border-[#00F0FF]/30 overflow-hidden shadow-[0_0_40px_rgba(0,240,255,0.05)] mt-10 relative" style={{ animationDelay: "800ms" }}>
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent"></div>
            <div className="bg-[#050A15] px-6 py-4 border-b border-[#1E293B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Zap size={18} className="text-[#00F0FF]" fill="#00F0FF" fillOpacity={0.2} />
                <div>
                  <h3 className="text-sm font-bold tracking-[0.25em] text-white uppercase drop-shadow-[0_0_8px_rgba(0,240,255,0.3)]">Master Prompt Engine</h3>
                  <p className="text-[9px] font-mono text-[#64748B] mt-1 tracking-widest">OPTIMIZED FOR V6 & SDXL ARCHITECTURE</p>
                </div>
              </div>
              <button 
                onClick={copyPrompt}
                className={`px-6 py-3 text-[10px] font-bold font-mono tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-2 border 
                  ${copySuccess ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/50' : 'bg-[#00F0FF]/5 text-[#00F0FF] border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 hover:border-[#00F0FF]'}`}
              >
                {copySuccess ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copySuccess ? 'PROMPT COPIED' : 'COPY MASTER PROMPT'}
              </button>
            </div>
            <div className="flex">
              <div className="w-10 bg-[#020617] border-r border-[#1E293B] flex flex-col items-center py-6 opacity-40 select-none font-mono text-[9px]">
                {[...Array(8)].map((_, i) => <span key={i} className="text-[#64748B] mb-7">{i+1}</span>)}
              </div>
              <div className="p-6 flex-1 bg-[#020617] relative group">
                <p className="text-[13px] md:text-[14px] leading-[2.2] text-[#E2E8F0] font-sans font-light tracking-wide whitespace-pre-wrap selection:bg-[#00F0FF]/30">
                  {result?.masterPrompt}
                  <span className="inline-block w-2 h-4 bg-[#00F0FF] ml-1 opacity-0 group-hover:opacity-100 animate-pulse align-middle"></span>
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 p-4 md:p-8" onClick={() => setIsLightboxOpen(false)}>
        <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors" onClick={() => setIsLightboxOpen(false)}>
          <X size={32} strokeWidth={1} />
        </button>
        <img src={image} alt="Enlarged Target" className="max-w-full max-h-full object-contain border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500" onClick={(e) => e.stopPropagation()} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#E2E8F0] font-sans relative overflow-x-hidden pt-4 pb-8 flex flex-col items-center justify-start">
      <div dangerouslySetInnerHTML={{__html: `
        <style>
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: #020617; }
          ::-webkit-scrollbar-thumb { background: #1E293B; }
          ::-webkit-scrollbar-thumb:hover { background: #00F0FF; }
          .custom-spin-slow { animation: spin 15s linear infinite; }
          .custom-spin-reverse-slow { animation: spin 20s linear infinite reverse; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-shimmer { animation: shimmer 2.5s infinite linear; }
          @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
          .custom-scan-line-image { animation: scanImage 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
          @keyframes scanImage { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
          .glitch-crosshair { animation: crosshairGlitch 4s infinite; }
          @keyframes crosshairGlitch { 0%, 90% { opacity: 0.5; transform: scale(1); } 92% { opacity: 0.8; transform: scale(1.1); } 94% { opacity: 0.2; transform: scale(0.95); } 96% { opacity: 0.9; transform: scale(1.05); } 100% { opacity: 0.5; transform: scale(1); } }
          .cyber-card-reveal { animation: cardReveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
          @keyframes cardReveal { 0% { opacity: 0; transform: translateY(20px) scale(0.98); filter: blur(5px); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
        </style>
      `}} />
      
      {/* 赛博网格背景 */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `linear-gradient(rgba(0, 240, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 1) 1px, transparent 1px)`, backgroundSize: '50px 50px' }}></div>
      <div className="fixed top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[#00F0FF]/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      
      {/* 顶部全局返回 Logo */}
      {renderTopNav()}

      {/* 步骤条 */}
      {renderStepIndicator()}
      
      {/* 主视图区 */}
      <div className="flex-1 w-full flex flex-col items-center justify-center mt-4">
        {currentStep === 0 && renderStep0()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      <Lightbox />
    </div>
  );
};

export default App;
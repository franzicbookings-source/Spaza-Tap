import React from "react";
import { ArrowLeft, Download, Share2, Printer, Copy, Check, QrCode } from "lucide-react";

interface ShopQrCodeScreenProps {
  shopName: string;
  shopCode: string;
  joinLink: string;
  onBack: () => void;
}

export default function ShopQrCodeScreen({
  shopName,
  shopCode,
  joinLink,
  onBack,
}: ShopQrCodeScreenProps) {
  const [copied, setCopied] = React.useState(false);

  // Generate QR URL from free, reliable public service
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(joinLink)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Join Cwebezela Tab for ${shopName}`,
          text: `Scan or click to request access to your tab at ${shopName}:`,
          url: joinLink,
        });
      } else {
        handleCopyLink();
        alert("Link copied! Share it on WhatsApp or SMS.");
      }
    } catch (e) {
      console.error("Web Share failed", e);
    }
  };

  const handleDownload = () => {
    // Download image source
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.target = "_blank";
    link.download = `cwebezela_qr_${shopCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cwebezela Tab - ${shopName}</title>
            <style>
              body {
                font-family: system-ui, sans-serif;
                text-align: center;
                padding: 40px;
                color: #3b1a1a;
                background-color: #ffffff;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                border: 8px double #c8521a;
                border-radius: 40px;
                padding: 40px 20px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
              }
              h1 {
                font-size: 42px;
                margin: 0 0 10px 0;
                font-weight: 900;
                color: #c8521a;
                text-transform: uppercase;
              }
              h2 {
                font-size: 26px;
                margin: 0 0 20px 0;
                font-weight: 800;
              }
              p.instruction {
                font-size: 18px;
                line-height: 1.5;
                font-weight: 600;
                margin-bottom: 30px;
                color: #6e463b;
              }
              .qr-box {
                margin: 30px auto;
                padding: 15px;
                border: 4px solid #3b1a1a;
                border-radius: 20px;
                width: 280px;
                height: 280px;
              }
              .qr-box img {
                width: 100%;
                height: 100%;
              }
              .shop-code {
                font-family: monospace;
                font-size: 24px;
                font-weight: 900;
                background-color: #eed6c0;
                color: #3b1a1a;
                padding: 8px 20px;
                border-radius: 12px;
                display: inline-block;
                margin-top: 10px;
              }
              .footer {
                margin-top: 50px;
                font-size: 14px;
                color: #6e463b;
                font-weight: 700;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Cwebezela Tab</h1>
              <h2>${shopName}</h2>
              <p class="instruction">Scan this QR Code to join our spaza tab records. You can request access, check your outstanding balance and payment history anytime!</p>
              <div class="qr-box">
                <img src="${qrImageUrl}" />
              </div>
              <div>
                <span class="shop-code">SHOP CODE: ${shopCode}</span>
              </div>
              <p class="footer">Keep your records clean, buy with peace of mind!</p>
            </div>
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5EDE0] flex flex-col font-sans pb-12">
      <header className="w-full pt-12 pb-4 px-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 bg-[#E5DACB] rounded-full flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-[#3B1A1A]" />
        </button>
        <span className="text-[10px] font-display font-black tracking-widest text-[#C8521A] uppercase bg-[#FFE5D8] px-3 py-1 rounded-full flex items-center gap-1">
          <QrCode className="w-3 h-3" /> SHOP QR CODE
        </span>
      </header>

      <main className="max-w-[420px] mx-auto w-full flex-1 flex flex-col px-6 text-center">
        <div className="bg-white rounded-3xl p-6 border border-[#E5DACB] shadow-sm mb-6 flex flex-col items-center">
          <h2 className="text-2xl font-display font-black text-[#3B1A1A] uppercase tracking-tighter mb-1">
            {shopName}
          </h2>
          <span className="font-mono text-xs font-black bg-[#FFE5D8] text-[#C8521A] px-3 py-1 rounded-md mb-4 uppercase">
            Shop Code: {shopCode}
          </span>

          {/* QR Code Container */}
          <div className="w-[200px] h-[200px] bg-slate-50 border-4 border-[#3B1A1A] p-2 rounded-2xl flex items-center justify-center mb-4 overflow-hidden relative group shadow">
            <img src={qrImageUrl} alt={`${shopName} QR Code`} className="w-full h-full object-contain" />
          </div>

          <p className="text-[11px] font-semibold text-[#6E463B] leading-relaxed max-w-[280px]">
            Customers can scan this QR code to request access to their tab. You must approve them before they can view their balance.
          </p>
        </div>

        {/* Join Link card */}
        <section className="bg-[#f9ede0] p-4 rounded-2xl border border-[#E8D0BB] text-left mb-6">
          <span className="text-[9px] font-display font-black tracking-widest text-[#C8521A] uppercase block mb-1">
            Customer Join Link
          </span>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              readOnly
              value={joinLink}
              className="bg-white border border-[#E8D0BB] p-2 text-xs font-mono font-bold text-[#3B1A1A] rounded-xl flex-grow"
            />
            <button
              onClick={handleCopyLink}
              className="bg-[#3B1A1A] text-white p-2.5 rounded-xl active:scale-95 transition-transform"
              title="Copy details link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </section>

        {/* Actions Button List */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShare}
              className="h-12 bg-[#3B1A1A] text-white rounded-xl flex items-center justify-center gap-1.5 font-display font-bold text-[11px] uppercase tracking-wider active:scale-95 transition-transform shadow-xs"
            >
              <Share2 className="w-4 h-4" /> Share Link
            </button>
            <button
              onClick={handleDownload}
              className="h-12 bg-[#3B1A1A] text-white rounded-xl flex items-center justify-center gap-1.5 font-display font-bold text-[11px] uppercase tracking-wider active:scale-95 transition-transform shadow-xs"
            >
              <Download className="w-4 h-4" /> Download QR
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="w-full h-12 bg-[#C8521A] text-white rounded-xl flex items-center justify-center gap-2 font-display font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform shadow"
          >
            <Printer className="w-4.5 h-4.5" /> Print Shop Poster / Banner
          </button>
        </div>
      </main>
    </div>
  );
}

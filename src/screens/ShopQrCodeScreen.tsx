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
          title: `Join Spaza Tap for ${shopName}`,
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
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.target = "_blank";
    link.download = `spaza_tap_qr_${shopCode}.png`;
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
            <title>Spaza Tap - ${shopName}</title>
            <style>
              body {
                font-family: system-ui, sans-serif;
                text-align: center;
                padding: 40px;
                color: #2b1114;
                background-color: #ffffff;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                border: 8px double #d94f12;
                border-radius: 40px;
                padding: 40px 20px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.05);
              }
              h1 {
                font-size: 42px;
                margin: 0 0 10px 0;
                font-weight: 900;
                color: #d94f12;
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
                color: #756766;
              }
              .qr-box {
                margin: 30px auto;
                padding: 15px;
                border: 4px solid #2b1114;
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
                background-color: #ffe9e8;
                color: #2b1114;
                padding: 8px 20px;
                border-radius: 12px;
                display: inline-block;
                margin-top: 10px;
              }
              .footer {
                margin-top: 50px;
                font-size: 14px;
                color: #756766;
                font-weight: 700;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Spaza Tap</h1>
              <h2>${shopName}</h2>
              <p class="instruction">Scan this QR Code to join our spaza tab records. You can request access, check your outstanding balance and payment history anytime!</p>
              <div class="qr-box">
                <img src="${qrImageUrl}" />
              </div>
              <div>
                <span class="shop-code">SHOP CODE: ${shopCode}</span>
              </div>
              <p class="footer">Keep your records clean, buy with peace of mind! Built by Ntombii Tech</p>
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
    <div className="w-full min-h-screen bg-[#FBF5EC] flex flex-col font-sans pb-16">
      
      {/* Visual Header */}
      <header className="w-full pt-5 pb-4 px-5 bg-white border-b border-[#2B1114]/8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 bg-[#F1EBE4] hover:bg-[#E5DACB] rounded-full flex items-center justify-center active:scale-95 transition-transform"
          title="Back to portal"
        >
          <ArrowLeft className="w-5 h-5 text-text-main stroke-[2.5]" />
        </button>
        <span className="text-[10px] font-bold tracking-wider text-[#D94F12] uppercase bg-[#FFF0E7] px-3.5 py-1 rounded-full flex items-center gap-1">
          <QrCode className="w-3.5 h-3.5" /> Shop QR Access Link
        </span>
      </header>

      <main className="max-w-[420px] mx-auto w-full flex-1 flex flex-col px-5 text-center mt-5">
        
        {/* Main QR Card */}
        <div className="bg-white rounded-[28px] p-6 border border-[#2B1114]/8 shadow-2xs mb-5 flex flex-col items-center">
          <h2 className="text-xl font-black text-text-main font-display uppercase tracking-tight mb-1">
            {shopName}
          </h2>
          <span className="font-mono text-xs font-black bg-[#FFF0E7] text-[#D94F12] px-3.5 py-1 rounded-xl mb-4.5 uppercase">
            Shop Code: {shopCode}
          </span>

          {/* QR Code Frame */}
          <div className="w-[190px] h-[190px] bg-white border-4 border-text-main p-2 rounded-2xl flex items-center justify-center mb-5 overflow-hidden shadow-2xs">
            <img src={qrImageUrl} alt={`${shopName} QR Code`} className="w-full h-full object-contain" />
          </div>

          <p className="text-xs font-bold text-text-light leading-relaxed max-w-[280px]">
            Customers scan this QR code to sign up or log in. You must approve their request link from your dashboard alerts panel before they can view their status.
          </p>
        </div>

        {/* Join Link box */}
        <section className="bg-white border border-[#2B1114]/8 p-4.5 rounded-[22px] text-left mb-6 shadow-2xs">
          <span className="text-[9px] font-black tracking-widest text-[#D94F12] uppercase block mb-1.5">
            Customer Join Link
          </span>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              readOnly
              value={joinLink}
              className="bg-[#FBF5EC] border border-text-main/10 p-2 text-xs font-mono font-bold text-text-main rounded-xl flex-grow select-all outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="bg-burgundy text-white hover:bg-[#2B1114] p-3 rounded-xl active:scale-95 transition-transform shrink-0"
              title="Copy Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </section>

        {/* Action Button Grid */}
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={handleShare}
              className="h-12 bg-[#F1EBE4] border border-text-main/10 text-text-main rounded-2xl flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform"
            >
              <Share2 className="w-4.5 h-4.5 text-[#D94F12]" /> Share Link
            </button>
            <button
              onClick={handleDownload}
              className="h-12 bg-[#F1EBE4] border border-text-main/10 text-text-main rounded-2xl flex items-center justify-center gap-1.5 font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform"
            >
              <Download className="w-4.5 h-4.5 text-[#D94F12]" /> Save Image
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="w-full h-[54px] bg-[#D94F12] hover:bg-[#C9460B] text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform shadow-[0_4px_12px_rgba(217,79,18,0.2)]"
          >
            <Printer className="w-4.5 h-4.5 stroke-[2.5]" /> Print Poster Flyer
          </button>
        </div>

        <span className="text-[10px] text-text-muted mt-8 font-extrabold tracking-widest uppercase">
          Built by Ntombii Tech
        </span>

      </main>
    </div>
  );
}

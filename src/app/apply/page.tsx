import Image from "next/image";

export default function ApplyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg,#321d3d,#672d86)" }}>

      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center space-y-5">

        <div className="flex justify-center">
          <Image src="/logo.png" alt="EDUZAH" width={130} height={40} style={{ objectFit: "contain" }} />
        </div>

        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl"
          style={{ background: "linear-gradient(135deg,#d91b5b,#faa633)" }}>
          🔒
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Applications Closed</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Thank you for your interest in joining <span className="font-semibold text-gray-700">EDUZAH</span>.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Applications for the current internship cycle are now closed.<br />
            Please follow our official channels to stay updated on future opportunities.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-1">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">For inquiries</p>
          <div className="flex justify-center gap-4">
            <a href="tel:01044222881" className="text-sm font-semibold" style={{ color: "#d91b5b" }}>01044222881</a>
            <span className="text-gray-300">|</span>
            <a href="tel:01146966811" className="text-sm font-semibold" style={{ color: "#d91b5b" }}>01146966811</a>
          </div>
        </div>

      </div>
    </div>
  );
}

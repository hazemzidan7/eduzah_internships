import Image from "next/image";

export default function ApplySuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg,#321d3d,#672d86)" }}>

      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center space-y-5">

        <div className="flex justify-center">
          <Image src="/logo.png" alt="EDUZAH" width={130} height={40} style={{ objectFit: "contain" }} />
        </div>

        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#d91b5b,#faa633)" }}>
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">تم استلام طلبك بنجاح!</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            شكراً لاهتمامك بالانضمام لفريق EDUZAH.<br />
            سيتم التواصل معك قريباً إذا تم اختيارك.
          </p>
        </div>

        <p className="text-xs text-gray-400 pt-2">
          استفسارات؟{" "}
          <a href="tel:01044222881" className="font-semibold" style={{ color: "#d91b5b" }}>01044222881</a>
          {" / "}
          <a href="tel:01146966811" className="font-semibold" style={{ color: "#d91b5b" }}>01146966811</a>
        </p>

      </div>
    </div>
  );
}

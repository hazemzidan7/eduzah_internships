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

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">التقديم مغلق</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            شكراً لاهتمامك بالانضمام لفريق EDUZAH.<br />
            تم إغلاق باب التقديم في الوقت الحالي.
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

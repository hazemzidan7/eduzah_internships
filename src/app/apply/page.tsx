import { ApplyForm } from "@/components/apply/apply-form";

const FORM_OPEN = process.env.NEXT_PUBLIC_FORM_OPEN !== "false";

export default function ApplyPage() {
  if (!FORM_OPEN) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#F8F7FF" }}>
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full text-center space-y-5">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{ background: "linear-gradient(135deg,#d91b5b,#faa633)" }}>
            🔒
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Applications Closed</h1>
            <p className="text-gray-500 leading-relaxed">
              Thank you for your interest in <span className="font-semibold text-[#d91b5b]">EDUZAH</span>.<br />
              Applications are currently closed. Please check back later.
            </p>
          </div>
          <p className="text-gray-400 text-sm">
            Questions? Call us:{" "}
            <a href="tel:01044222881" className="text-[#d91b5b] font-medium">01044222881</a>
            {" "}/{" "}
            <a href="tel:01146966811" className="text-[#d91b5b] font-medium">01146966811</a>
          </p>
        </div>
      </div>
    );
  }

  return <ApplyForm />;
}

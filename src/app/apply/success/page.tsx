import Link from "next/link";

export default function ApplySuccessPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#F8F7FF" }}
    >
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full text-center space-y-6">
        {/* Animated checkmark */}
        <div
          className="mx-auto w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{ background: "linear-gradient(135deg,#d91b5b,#faa633)" }}
        >
          🎉
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Application Submitted Successfully!
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Thank you for applying to <span className="font-semibold text-[#d91b5b]">EDUZAH</span>.
            <br />
            Our team will review your application and contact shortlisted candidates.
          </p>
        </div>

        <div
          className="rounded-2xl p-4 text-sm text-gray-600"
          style={{ background: "#F8F7FF" }}
        >
          <p className="font-medium mb-1">What happens next?</p>
          <ul className="space-y-1 text-left list-disc list-inside">
            <li>Our team reviews your application</li>
            <li>Shortlisted candidates receive a call</li>
            <li>Initial interview is scheduled</li>
            <li>Top performers get a job offer</li>
          </ul>
        </div>

        <p className="text-gray-400 font-medium text-lg">Good luck! 🚀</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm font-medium"
          >
            Go to Home
          </Link>
          <Link
            href="/apply"
            className="px-6 py-2.5 rounded-xl text-white text-sm font-medium transition"
            style={{ background: "linear-gradient(135deg,#d91b5b,#faa633)" }}
          >
            Submit Another Application
          </Link>
        </div>
      </div>

      {/* Contact */}
      <p className="mt-8 text-sm text-gray-400">
        Questions? Call us:{" "}
        <a href="tel:01044222881" className="text-[#d91b5b] font-medium">
          01044222881
        </a>{" "}
        /{" "}
        <a href="tel:01146966811" className="text-[#d91b5b] font-medium">
          01146966811
        </a>
      </p>
    </div>
  );
}

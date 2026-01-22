import ChatWidget from "@/components/chat/ChatWidget";
import { Car, Shield, Clock, HeadphonesIcon } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-carsa-primary text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">Carsa</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-white/80">Browse Cars</a>
            <a href="#" className="hover:text-white/80">Sell Your Car</a>
            <a href="#" className="hover:text-white/80">Finance</a>
            <a href="#" className="hover:text-white/80">Service</a>
            <a href="/admin" className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30">
              Admin Dashboard
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-carsa-accent/10 text-carsa-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
          <HeadphonesIcon className="w-4 h-4" />
          AI-Powered Customer Support
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Need Help With Your<br />
          <span className="text-carsa-primary">Carsa Purchase?</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Our AI assistant can help you with delivery updates, missing accessories,
          refunds, and more. Get instant answers 24/7.
        </p>

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button className="bg-carsa-primary text-white px-6 py-3 rounded-lg hover:bg-carsa-secondary transition-colors">
            Track My Order
          </button>
          <button className="bg-white text-carsa-primary border border-carsa-primary px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
            Report an Issue
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-carsa-success/10 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-carsa-success" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Instant Responses</h3>
            <p className="text-gray-600 text-sm">
              Get immediate answers to your questions without waiting on hold.
              Our AI assistant is available 24/7.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-carsa-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-carsa-primary" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Take Action</h3>
            <p className="text-gray-600 text-sm">
              Our AI can process refunds, arrange replacements, and create
              support tickets - resolving issues on the spot.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-carsa-warning/10 rounded-lg flex items-center justify-center mb-4">
              <HeadphonesIcon className="w-6 h-6 text-carsa-warning" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Human Backup</h3>
            <p className="text-gray-600 text-sm">
              Complex issues are seamlessly transferred to our specialist team
              who will call you back within hours.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="bg-carsa-primary/5 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Try It Now</h2>
            <p className="text-gray-600">
              Click the chat button in the bottom right corner to start a conversation
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 max-w-2xl mx-auto shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Sample Scenarios to Try:</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-carsa-success font-bold">1.</span>
                <span>
                  <strong>Missing accessory:</strong> &quot;I bought a BMW 3 Series and the charging cable
                  wasn&apos;t included&quot;
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-carsa-success font-bold">2.</span>
                <span>
                  <strong>Delivery status:</strong> &quot;When will my Mercedes A-Class be delivered?
                  My email is sarah.chen@email.com&quot;
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-carsa-success font-bold">3.</span>
                <span>
                  <strong>Refund request:</strong> &quot;I want a refund for the cleaning kit I never
                  received. My order is ORD-2024-00004&quot;
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-carsa-warning font-bold">4.</span>
                <span>
                  <strong>Safety issue (escalation):</strong> &quot;The brakes on my Audi A4 are
                  making a grinding noise&quot;
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-carsa-warning font-bold">5.</span>
                <span>
                  <strong>Vulnerable customer (escalation):</strong> &quot;I need this refund urgently,
                  I&apos;ve lost my job&quot;
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-carsa-secondary text-white/80 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p className="mb-2">
            This is a demo of the Carsa AI Complaints Assistant
          </p>
          <p>
            Built with Next.js, Gemini AI, and Prisma
          </p>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </main>
  );
}

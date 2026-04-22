import { motion } from "framer-motion";
import { CheckCircle, Mail, CreditCard, UserPlus } from "lucide-react";

export default function PaymentProcess() {
  const steps = [
    {
      number: "1",
      icon: CreditCard,
      title: "Pay with Stripe",
      description: "Click the button below and complete your $49 USD one-time payment using the secure Stripe checkout. Use the email you want for your login."
    },
    {
      number: "2",
      icon: UserPlus,
      title: "Account Setup",
      description: "We'll process your payment and set up your Motion Code account with complete access to all movement programs and exercises for 2 years."
    },
    {
      number: "3",
      icon: Mail,
      title: "Access Email Sent",
      description: "Within 24 hours, you'll receive your login credentials via email. Check your inbox and junk folder for your account details from Prepared to Play."
    },
    {
      number: "4",
      icon: CheckCircle,
      title: "Start Learning",
      description: "Log in to Motion Code and begin mastering the four running qualities: Acceleration, Deceleration, Change of Direction, and Top Speed."
    }
  ];

  return (
    <section className="py-24 px-6 md:px-20 bg-p2p-dark">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto"
      >
        <h2 className="font-heading text-5xl md:text-7xl font-bold text-center mb-6 text-white leading-tight tracking-tight">
          How It Works
        </h2>
        <p className="text-center text-gray-300 font-body mb-16 text-2xl md:text-3xl font-light">
          Get started with Motion Code in 4 simple steps
        </p>

        {/* Step-by-step vertical layout */}
        <div className="relative space-y-6 mb-16">
          {/* Connecting line */}
          <div className="absolute left-8 top-16 bottom-16 w-0.5 bg-gradient-to-b from-p2p-blue to-p2p-electric hidden md:block" />
          
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="flex items-start gap-6">
                  {/* Step Number Circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-p2p-blue to-p2p-electric flex items-center justify-center shadow-glow">
                      <span className="font-heading text-2xl text-white">{step.number}</span>
                    </div>
                  </div>
                  
                  {/* Step Content Card */}
                  <div className="flex-1 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-p2p-border rounded-2xl p-6 hover:border-p2p-blue/50 transition">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-p2p-blue/20 to-p2p-electric/20 p-3 rounded-xl">
                        <Icon className="w-6 h-6 text-p2p-electric" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-heading text-2xl font-bold text-white mb-3">{step.title}</h3>
                        <p className="font-body text-gray-300 leading-relaxed text-lg">{step.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://buy.stripe.com/00w8wRdrl9mD7Bvgqw6g800"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-5 rounded-full bg-gradient-to-r from-p2p-blue to-p2p-electric font-body text-white text-xl font-semibold shadow-2xl hover:shadow-p2p-electric/60 transition-all duration-300 hover:scale-105 uppercase tracking-wide text-center"
            data-testid="button-buy-now"
          >
            Get Access
          </a>
        </div>
      </motion.div>
    </section>
  );
}

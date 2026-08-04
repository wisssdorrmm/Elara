import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col justify-between bg-gradient-to-b from-primary via-primary to-secondary px-6 py-10 text-white">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <span className="text-lg font-semibold">HerCycle</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold leading-tight">
          Understand your cycle.
          <br />
          Empower your life.
        </h1>
      </motion.div>

      <div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-3"
        >
          <Button variant="primary" className="!bg-white !text-primary" onClick={() => navigate('/onboarding')}>
            Get Started
          </Button>
          <button
            onClick={() => navigate('/login')}
            className="w-full text-center text-sm font-medium text-white/90 underline-offset-2 hover:underline"
          >
            I already have an account
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-4 text-center text-xs text-white/60"
        >
          By continuing, you agree to our{' '}
          <button className="underline underline-offset-2">Privacy Policy</button> and{' '}
          <button className="underline underline-offset-2">Terms</button>
        </motion.p>
      </div>
    </div>
  );
}

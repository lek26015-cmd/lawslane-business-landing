
import { UnifiedSurveyForm } from '@/components/forms/unified-survey-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lawslane Product Research Survey',
  description: 'แบบสอบถามความต้องการระบบจัดการกฎหมายเพื่อธุรกิจ สำหรับ SMEs และองค์กร',
};

export default function UnifiedSurveyPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 md:py-24 relative overflow-hidden">
      {/* Decorative backgrounds */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] bg-indigo-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto relative z-10">
        <UnifiedSurveyForm />
      </div>
    </div>
  );
}

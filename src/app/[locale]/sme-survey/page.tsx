
import { SmeSurveyForm } from '@/components/forms/sme-survey-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SME Legal Pain Points Survey | Lawslane',
  description: 'การศึกษาปัญหาทางกฎหมายและความคาดหวังในการใช้งาน Lawslane สำหรับผู้ประกอบการ SMEs',
};

export default function SmeSurveyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:py-24">
      <div className="container mx-auto">
        <SmeSurveyForm />
      </div>
    </div>
  );
}

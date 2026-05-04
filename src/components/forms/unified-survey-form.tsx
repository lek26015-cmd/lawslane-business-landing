
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Loader2, ClipboardCheck, Sparkles, Building2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  // Section 1: Profile
  respondentName: z.string().min(2, { message: 'กรุณาระบุชื่อ-นามสกุลและตำแหน่ง' }),
  role: z.string().min(1, { message: 'กรุณาเลือกบทบาทของคุณ' }),
  businessType: z.string().min(1, { message: 'กรุณาเลือกประเภทธุรกิจ' }),
  businessTypeOther: z.string().optional(),
  businessSize: z.string().min(1, { message: 'กรุณาเลือกขนาดธุรกิจ' }),
  businessDuration: z.string().min(1, { message: 'กรุณาระบุระยะเวลาดำเนินธุรกิจ' }),
  contractVolume: z.string().min(1, { message: 'กรุณาเลือกปริมาณสัญญา' }),

  // Section 2: Challenges
  challenges: z.array(z.string()).min(1, { message: 'กรุณาเลือกอย่างน้อย 1 ข้อ' }),
  challengesOther: z.string().optional(),
  currentTool: z.string().min(1, { message: 'กรุณาระบุเครื่องมือที่ใช้' }),
  initialHandling: z.string().min(5, { message: 'กรุณาระบุวิธีจัดการเบื้องต้น' }),

  // Section 3: AI & Tech
  aiExpectation: z.string().min(1, { message: 'กรุณาให้คะแนน' }),
  aiTimeSaved: z.string().min(1, { message: 'กรุณาเลือกการคาดการณ์' }),
  aiConcerns: z.string().min(1, { message: 'กรุณาระบุข้อกังวล' }),
  preferredChannel: z.string().min(1, { message: 'กรุณาเลือกช่องทาง' }),

  // Section 4: Market & Support
  hiringObstacles: z.array(z.string()).min(1, { message: 'กรุณาเลือกอย่างน้อย 1 ข้อ' }),
  confidenceFactor: z.string().min(1, { message: 'กรุณาเลือกปัจจัยหลัก' }),
  outsourceInterest: z.string().min(1, { message: 'กรุณาเลือกระดับความสนใจ' }),
  subscriptionInterest: z.string().min(5, { message: 'กรุณาระบุฟีเจอร์ที่สนใจ' }),
  consent: z.boolean().refine(val => val === true, { message: 'กรุณากดยินยอมเพื่อดำเนินการต่อ' }),
});

const ROLES = [
  { id: 'executive', label: 'ผู้บริหารระดับสูง (C-Level / Founder)' },
  { id: 'inhouse_legal', label: 'ที่ปรึกษากฎหมายภายในองค์กร' },
  { id: 'operations', label: 'ฝ่ายปฏิบัติการ / จัดซื้อ / HR' },
  { id: 'other', label: 'อื่นๆ' },
];

const BUSINESS_TYPES = [
  { id: 'service', label: 'ภาคบริการ (ร้านอาหาร, โรงแรม, Horeca)' },
  { id: 'manufacturing', label: 'การผลิต / อุตสาหกรรม' },
  { id: 'retail', label: 'ค้าปลีก-ค้าส่ง / E-commerce' },
  { id: 'tech', label: 'เทคโนโลยี / ดิจิทัล / SaaS' },
  { id: 'other', label: 'อื่นๆ (โปรดระบุ)' },
];

const CHALLENGES = [
  { id: 'drafting', label: 'การร่างและจัดทำสัญญาใหม่' },
  { id: 'reviewing', label: 'การตรวจสอบและแก้ไขสัญญา (Review)' },
  { id: 'labor', label: 'ปัญหาด้านแรงงานและกฎระเบียบพนักงาน' },
  { id: 'ip', label: 'การจดทะเบียนทรัพย์สินทางปัญญา (เครื่องหมายการค้า/ลิขสิทธิ์)' },
  { id: 'debt', label: 'การติดตามหนี้สินและลูกหนี้ค้างชำระ' },
  { id: 'approval', label: 'ความล่าช้าในขั้นตอนการอนุมัติเอกสาร' },
  { id: 'storage', label: 'การจัดเก็บและค้นหาเอกสารกฎหมาย' },
  { id: 'compliance', label: 'การติดตามการปฏิบัติตามกฎหมาย (Compliance)' },
  { id: 'other', label: 'อื่นๆ (โปรดระบุ)' },
];

const HIRING_OBSTACLES = [
  { id: 'cost', label: 'ค่าใช้จ่ายไม่โปร่งใส หรือกังวลเรื่องงบบานปลาย' },
  { id: 'expertise', label: 'หาทนายที่มีความเชี่ยวชาญตรงกับอุตสาหกรรมยาก' },
  { id: 'process', label: 'กระบวนการทางกฎหมายเข้าถึงยากและซับซ้อน' },
  { id: 'trust', label: 'ความไม่มั่นใจในความน่าเชื่อถือหรือผลงาน' },
];

export function UnifiedSurveyForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      respondentName: '',
      role: '',
      businessType: '',
      businessTypeOther: '',
      businessSize: '',
      businessDuration: '',
      contractVolume: '',
      challenges: [],
      challengesOther: '',
      currentTool: '',
      initialHandling: '',
      aiExpectation: '',
      aiTimeSaved: '',
      aiConcerns: '',
      preferredChannel: '',
      hiringObstacles: [],
      confidenceFactor: '',
      outsourceInterest: '',
      subscriptionInterest: '',
      consent: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) throw new Error("Firestore not initialized");

      await addDoc(collection(db, 'unified_surveys'), {
        ...values,
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting unified survey:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งแบบสอบถามได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function onInvalid(errors: any) {
    toast({
      title: "กรุณากรอกข้อมูลให้ครบถ้วน",
      description: "มีบางช่องที่ยังไม่ได้กรอก หรือกรอกไม่ถูกต้อง (กรุณาตรวจสอบข้อความสีแดงในฟอร์ม)",
      variant: "destructive"
    });
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-3xl mx-auto text-center py-20 border-none shadow-2xl bg-white rounded-[2rem]">
        <CardContent className="space-y-6 flex flex-col items-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-inner animate-pulse">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <CardTitle className="text-4xl font-extrabold text-slate-900 tracking-tight">ขอบคุณมากครับ!</CardTitle>
          <CardDescription className="text-xl text-slate-600 max-w-lg leading-relaxed">
            ข้อมูลของท่านมีค่ามหาศาลในการช่วยให้ Lawslane พัฒนา "Legal OS" ที่ตอบโจทย์ธุรกิจไทยอย่างแท้จริง
          </CardDescription>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-6 h-12 px-8 rounded-xl font-bold">
            ส่งแบบสอบถามเพิ่มเติม
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border-none overflow-hidden rounded-[2.5rem] bg-white/80 backdrop-blur-sm border border-white">
      <div className="h-4 bg-gradient-to-r from-[#002f4b] via-[#004a75] to-[#002f4b]" />
      <CardHeader className="bg-white/50 pb-10 pt-12 px-8 md:px-16 text-center">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold tracking-wide uppercase">
            <Sparkles className="w-4 h-4" />
            Lawslane Product Research
          </div>
        </div>
        <CardTitle className="text-4xl font-black text-slate-900 leading-[1.1] mb-6">
          แบบสอบถามความต้องการ<br/><span className="text-[#004a75]">ระบบจัดการกฎหมายเพื่อธุรกิจ</span>
        </CardTitle>
        <CardDescription className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
          ช่วยเราสร้างแพลตฟอร์มที่ทำให้เรื่องกฎหมายเป็นเรื่องง่ายสำหรับคุณ
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-8 md:px-16 pb-16">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-16">
            
            {/* Section 1: Profile */}
            <div className="space-y-10">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#002f4b] text-white font-black shadow-lg shadow-blue-200">1</div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">ข้อมูลพื้นฐานธุรกิจ</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="respondentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-bold">ชื่อ-นามสกุล และตำแหน่ง</FormLabel>
                      <FormControl>
                        <Input placeholder="เช่น สมชาย ใจดี (CEO)" className="h-14 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-bold">บทบาทหลักของคุณ</FormLabel>
                      <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2">
                        {ROLES.map((role) => (
                          <FormItem key={role.id} className="flex items-center space-x-2 space-y-0 p-2">
                            <FormControl><RadioGroupItem value={role.id} /></FormControl>
                            <FormLabel className="font-medium cursor-pointer">{role.label}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-slate-700 font-bold">ประเภทธุรกิจ</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                      >
                        {BUSINESS_TYPES.map((type) => (
                          <FormItem key={type.id} className="flex items-center space-x-3 space-y-0 rounded-2xl border border-slate-100 p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group">
                            <FormControl>
                              <RadioGroupItem value={type.id} />
                            </FormControl>
                            <FormLabel className="font-medium w-full cursor-pointer text-slate-600 group-hover:text-blue-700">
                              {type.label}
                              {type.id === 'other' && field.value === 'other' && (
                                <Input 
                                  className="mt-3 h-11 rounded-lg" 
                                  placeholder="ระบุประเภทธุรกิจ" 
                                  onChange={(e) => form.setValue('businessTypeOther', e.target.value)}
                                />
                              )}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="businessSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-bold">จำนวนพนักงาน</FormLabel>
                      <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-1">
                        {['1-15 คน', '16-50 คน', '51-200 คน', '>200 คน'].map((s) => (
                          <FormItem key={s} className="flex items-center space-x-2 p-1">
                            <FormControl><RadioGroupItem value={s} /></FormControl>
                            <FormLabel className="text-sm cursor-pointer">{s}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-bold">ระยะเวลาทำธุรกิจ</FormLabel>
                      <Input placeholder="เช่น 2 ปี" className="h-12 bg-slate-50/50 rounded-xl" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-bold">ปริมาณสัญญา / เดือน</FormLabel>
                      <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-1">
                        {['<10', '10-30', '31-50', '>50'].map((v) => (
                          <FormItem key={v} className="flex items-center space-x-2 p-1">
                            <FormControl><RadioGroupItem value={v} /></FormControl>
                            <FormLabel className="text-sm cursor-pointer">{v}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 2: Challenges */}
            <div className="space-y-10">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#002f4b] text-white font-black shadow-lg shadow-blue-200">2</div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">การดำเนินงานและความท้าทาย</h3>
              </div>

              <FormField
                control={form.control}
                name="challenges"
                render={() => (
                  <FormItem className="space-y-5">
                    <FormLabel className="text-slate-700 font-bold">ปัญหาทางกฎหมายหรือความล่าช้าที่พบรบกวนการทำงาน (เลือกได้มากกว่า 1 ข้อ)</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CHALLENGES.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="challenges"
                          render={({ field }) => (
                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-slate-100 p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    return checked
                                      ? field.onChange([...current, item.id])
                                      : field.onChange(current.filter((val) => val !== item.id));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-medium w-full cursor-pointer leading-tight text-slate-600">
                                {item.label}
                                {item.id === 'other' && field.value?.includes('other') && (
                                  <Input 
                                    className="mt-3 h-10 rounded-lg" 
                                    placeholder="ระบุเพิ่มเติม" 
                                    onChange={(e) => form.setValue('challengesOther', e.target.value)}
                                  />
                                )}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="currentTool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-bold">เครื่องมือจัดการสัญญาที่ใช้อยู่ในปัจจุบัน</FormLabel>
                      <FormControl>
                        <Input placeholder="เช่น Word, Google Docs, ERP..." className="h-14 bg-slate-50/50 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initialHandling"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-bold">หากมีปัญหาหรือข้อพิพาท ท่านจัดการอย่างไรเบื้องต้น?</FormLabel>
                      <FormControl>
                        <Textarea placeholder="เช่น ปรึกษาคนรู้จัก, ค้นหาข้อมูลเอง..." className="min-h-[100px] bg-slate-50/50 rounded-xl resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 3: AI & Tech */}
            <div className="space-y-10">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#002f4b] text-white font-black shadow-lg shadow-blue-200">3</div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">เทคโนโลยีและ AI</h3>
              </div>

              <div className="bg-blue-50/50 p-8 rounded-[2rem] space-y-8 border border-blue-100/50">
                <FormField
                  control={form.control}
                  name="aiExpectation"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-blue-900 font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                        ความคาดหวังต่อ AI ในการช่วยวิเคราะห์ความเสี่ยงและประหยัดเวลา
                        <span className="text-xs font-normal opacity-70 ml-2">(1 = ไม่ช่วยเลย, 5 = ช่วยได้มากที่สุด)</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex justify-between max-w-md mx-auto pt-4"
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <FormItem key={val} className="flex flex-col items-center space-y-2">
                              <FormControl><RadioGroupItem value={val.toString()} className="h-6 w-6 border-blue-300" /></FormControl>
                              <FormLabel className="font-black text-xl text-blue-900">{val}</FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aiTimeSaved"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-blue-900 font-bold">ท่านคาดว่า AI จะช่วยประหยัดเวลาการตรวจสัญญาได้กี่เปอร์เซ็นต์?</FormLabel>
                      <FormControl>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {['<20%', '20-40%', '40-60%', '>60%'].map((v) => (
                            <FormItem key={v} className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-blue-100">
                              <FormControl><RadioGroupItem value={v} /></FormControl>
                              <FormLabel className="font-medium cursor-pointer text-blue-800">{v}</FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="aiConcerns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-bold">ข้อกังวลหลักเกี่ยวกับการนำ AI มาใช้ในงานกฎหมาย</FormLabel>
                      <FormControl>
                        <Input placeholder="เช่น ความแม่นยำ, ความลับข้อมูล..." className="h-14 bg-slate-50/50 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredChannel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-bold">ช่องทางที่ท่านถนัดใช้งานเครื่องมือมากที่สุด</FormLabel>
                      <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2">
                        {[
                          { id: 'web', label: 'เว็บไซต์ (คอมพิวเตอร์)' },
                          { id: 'app', label: 'แอปพลิเคชันมือถือ' },
                          { id: 'chat', label: 'ระบบแชท (LINE / Web Chat)' }
                        ].map((item) => (
                          <FormItem key={item.id} className="flex items-center space-x-2 p-1">
                            <FormControl><RadioGroupItem value={item.id} /></FormControl>
                            <FormLabel className="cursor-pointer text-sm">{item.label}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 4: Market */}
            <div className="space-y-10">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#002f4b] text-white font-black shadow-lg shadow-blue-200">4</div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">การจ้างงานและบริการสนับสนุน</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FormField
                  control={form.control}
                  name="hiringObstacles"
                  render={() => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-slate-700 font-bold">อุปสรรคที่ทำให้ลังเลจะจ้างทนายความอิสระ</FormLabel>
                      <div className="grid gap-2">
                        {HIRING_OBSTACLES.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="hiringObstacles"
                            render={({ field }) => (
                              <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-slate-50 p-3 hover:bg-slate-50">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      return checked
                                        ? field.onChange([...current, item.id])
                                        : field.onChange(current.filter((val) => val !== item.id));
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-xs font-medium cursor-pointer leading-relaxed text-slate-600">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-8">
                  <FormField
                    control={form.control}
                    name="confidenceFactor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-bold">ปัจจัยที่ทำให้มั่นใจที่สุดในการเลือกทนาย</FormLabel>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2">
                          {[
                            { id: 'license', label: 'ประวัติและใบอนุญาตทนายที่ชัดเจน' },
                            { id: 'review', label: 'ระบบรีวิวจากผู้ใช้จริง' },
                            { id: 'price', label: 'ตารางราคาและขอบเขตงานที่ชัดเจน' },
                            { id: 'ai', label: 'ระบบ AI ช่วยแนะนำทนายตามปัญหา' }
                          ].map((item) => (
                            <FormItem key={item.id} className="flex items-center space-x-2 p-1">
                              <FormControl><RadioGroupItem value={item.id} /></FormControl>
                              <FormLabel className="text-xs cursor-pointer">{item.label}</FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="outsourceInterest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-bold">ความสนใจจ้างงานผ่านแพลตฟอร์ม</FormLabel>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                          {['สนใจมาก', 'ปานกลาง', 'น้อย', 'ไม่สนใจ'].map((v) => (
                            <FormItem key={v} className="flex items-center space-x-1">
                              <FormControl><RadioGroupItem value={v} /></FormControl>
                              <FormLabel className="text-xs cursor-pointer">{v}</FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="subscriptionInterest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-bold">ฟีเจอร์ใดในรูปแบบ Subscription ที่ท่านยินดีจะจ่ายเพื่อใช้งาน?</FormLabel>
                    <FormControl>
                      <Textarea placeholder="เช่น ระบบร่างสัญญารายเดือน, คูปองปรึกษาทนาย..." className="min-h-[120px] bg-slate-50/50 rounded-2xl resize-none border-slate-200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="consent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-blue-100 bg-blue-50/30 p-6">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium text-slate-700 cursor-pointer">
                      ยินยอมให้เก็บรวบรวมและใช้ข้อมูลตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)
                    </FormLabel>
                    <p className="text-xs text-slate-500">
                      ข้อมูลของท่านจะถูกเก็บเป็นความลับและนำไปใช้เพื่อการพัฒนาแพลตฟอร์ม Lawslane เท่านั้น
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-[#002f4b] hover:bg-[#004a75] text-white h-16 text-xl font-black rounded-2xl shadow-xl shadow-blue-100 transition-all hover:-translate-y-1 active:translate-y-0 active:scale-98" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  กำลังบันทึกข้อมูล...
                </>
              ) : (
                'ส่งแบบสอบถาม (Submit)'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

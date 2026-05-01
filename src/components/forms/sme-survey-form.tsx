
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
import { CheckCircle2, Loader2, ClipboardCheck } from 'lucide-react';

const formSchema = z.object({
  // Section 1: SME Profile
  respondentName: z.string().min(2, { message: 'กรุณาระบุชื่อ-นามสกุลและตำแหน่ง' }),
  businessType: z.string().min(1, { message: 'กรุณาเลือกประเภทธุรกิจ' }),
  businessTypeOther: z.string().optional(),
  businessSize: z.string().min(1, { message: 'กรุณาเลือกขนาดธุรกิจ' }),
  businessDuration: z.string().min(1, { message: 'กรุณาระบุระยะเวลาดำเนินธุรกิจ' }),

  // Section 2: Legal Pain Points
  legalProblems: z.array(z.string()).min(1, { message: 'กรุณาเลือกอย่างน้อย 1 ข้อ' }),
  legalProblemsOther: z.string().optional(),
  initialHandling: z.string().min(5, { message: 'กรุณาระบุวิธีจัดการเบื้องต้น' }),
  hiringObstacles: z.array(z.string()).min(1, { message: 'กรุณาเลือกอย่างน้อย 1 ข้อ' }),
  hiringObstaclesOther: z.string().optional(),

  // Section 3: Technology Acceptance
  aiHelpfulness: z.string().min(1, { message: 'กรุณาให้คะแนน' }),
  preferredChannel: z.string().min(1, { message: 'กรุณาเลือกช่องทางที่ถนัด' }),

  // Section 4: UX & Incentives
  confidenceFactor: z.string().min(1, { message: 'กรุณาเลือกปัจจัยที่สำคัญที่สุด' }),
  subscriptionInterest: z.string().min(5, { message: 'กรุณาระบุฟีเจอร์ที่สนใจ' }),
});

const BUSINESS_TYPES = [
  { id: 'service', label: 'ภาคบริการ (เช่น ร้านอาหาร, โรงแรม, Horeca)' },
  { id: 'manufacturing', label: 'การผลิต' },
  { id: 'retail', label: 'ค้าปลีก-ค้าส่ง' },
  { id: 'tech', label: 'เทคโนโลยีและดิจิทัล' },
  { id: 'other', label: 'อื่นๆ (โปรดระบุ)' },
];

const LEGAL_PROBLEMS = [
  { id: 'contract', label: 'ปัญหาด้านสัญญาธุรกิจ (เช่น คู่ค้าผิดสัญญา, การร่างสัญญาจ้าง, สัญญา NDA)' },
  { id: 'labor', label: 'ปัญหาด้านแรงงานและลูกจ้าง (เช่น กฎระเบียบพนักงาน, สัญญาจ้างงาน, การเลิกจ้าง)' },
  { id: 'ip', label: 'ปัญหาด้านทรัพย์สินทางปัญญา (เช่น การจดเครื่องหมายการค้า, ลิขสิทธิ์)' },
  { id: 'debt', label: 'ปัญหาด้านหนี้สิน (เช่น ลูกหนี้ค้างชำระ, การทวงถามหนี้, เช็คเด้ง)' },
  { id: 'other', label: 'อื่นๆ (โปรดระบุ)' },
];

const HIRING_OBSTACLES = [
  { id: 'cost', label: 'กังวลเรื่องค่าใช้จ่ายที่ไม่โปร่งใส หรือบานปลาย' },
  { id: 'expertise', label: 'ไม่ทราบช่องทางในการค้นหาทนายความที่มีความเชี่ยวชาญตรงกับอุตสาหกรรม' },
  { id: 'process', label: 'รู้สึกว่ากระบวนการทางกฎหมายเข้าถึงยากและใช้เวลานาน' },
  { id: 'trust', label: 'ไม่มั่นใจในความน่าเชื่อถือของทนายความ' },
  { id: 'other', label: 'อื่นๆ (โปรดระบุ)' },
];

export function SmeSurveyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      legalProblems: [],
      hiringObstacles: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) throw new Error("Firestore not initialized");

      await addDoc(collection(db, 'sme_survey_responses'), {
        ...values,
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting SME survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-3xl mx-auto text-center py-16 border-none shadow-xl bg-slate-50">
        <CardContent className="space-y-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900">ขอบคุณสำหรับข้อมูลที่มีคุณค่า!</CardTitle>
          <CardDescription className="text-lg text-slate-600 max-w-md">
            ความคิดเห็นของท่านจะช่วยให้ Lawslane พัฒนาแพลตฟอร์มที่ตอบโจทย์ SMEs ไทยได้ดียิ่งขึ้น ทีมงานจะนำข้อมูลไปวิเคราะห์เพื่อพัฒนาฟีเจอร์ใหม่ๆ ต่อไป
          </CardDescription>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
            ส่งแบบสอบถามเพิ่มเติม
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-2xl border-none overflow-hidden rounded-3xl">
      <div className="h-3 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500" />
      <CardHeader className="bg-white pb-8 pt-10 px-8 md:px-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">แบบสอบถาม SME</Badge>
        </div>
        <CardTitle className="text-3xl font-bold text-slate-900 leading-tight">
          การศึกษาปัญหาทางกฎหมายและความคาดหวังสำหรับผู้ประกอบการ SMEs
        </CardTitle>
        <CardDescription className="text-base text-slate-500 mt-4 leading-relaxed">
          ข้อมูลที่ได้จะนำไปพัฒนาแพลตฟอร์มมาร์เก็ตเพลสทนายความให้ตอบโจทย์ธุรกิจของคุณมากที่สุด (ใช้เวลาประมาณ 5 นาที)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 md:px-12 pb-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
            
            {/* Section 1: SME Profile */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b pb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">1</span>
                <h3 className="text-xl font-bold text-slate-800">ข้อมูลพื้นฐานธุรกิจ (SME Profile)</h3>
              </div>

              <FormField
                control={form.control}
                name="respondentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">ชื่อ-นามสกุล และตำแหน่งของผู้ให้สัมภาษณ์</FormLabel>
                    <FormControl>
                      <Input placeholder="ระบุชื่อและตำแหน่งของคุณ" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-base font-semibold">ประเภทธุรกิจของท่าน</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid gap-3"
                      >
                        {BUSINESS_TYPES.map((type) => (
                          <FormItem key={type.id} className="flex items-center space-x-3 space-y-0 rounded-xl border p-4 hover:bg-slate-50 transition-colors">
                            <FormControl>
                              <RadioGroupItem value={type.id} />
                            </FormControl>
                            <FormLabel className="font-normal w-full cursor-pointer">
                              {type.label}
                              {type.id === 'other' && field.value === 'other' && (
                                <Input 
                                  className="mt-2 h-10" 
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="businessSize"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-base font-semibold">ขนาดของธุรกิจ (จำนวนพนักงาน)</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} className="grid gap-2">
                          {['1 - 5 คน', '6 - 15 คน', '16 - 30 คน', 'มากกว่า 30 คน'].map((size) => (
                            <FormItem key={size} className="flex items-center space-x-3 space-y-0 border p-3 rounded-lg">
                              <FormControl><RadioGroupItem value={size} /></FormControl>
                              <FormLabel className="font-normal cursor-pointer">{size}</FormLabel>
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
                  name="businessDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">ระยะเวลาที่ท่านดำเนินธุรกิจนี้มา</FormLabel>
                      <FormControl>
                        <Input placeholder="เช่น 3 ปี" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 2: Pain Points */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b pb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">2</span>
                <h3 className="text-xl font-bold text-slate-800">ปัญหาและอุปสรรคทางกฎหมายหน้างาน</h3>
              </div>

              <FormField
                control={form.control}
                name="legalProblems"
                render={() => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-base font-semibold">ปัญหาทางกฎหมายที่พบรบกวนการทำงานบ่อยที่สุด (เลือกได้มากกว่า 1 ข้อ)</FormLabel>
                    <div className="grid gap-3">
                      {LEGAL_PROBLEMS.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="legalProblems"
                          render={({ field }) => (
                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 hover:bg-slate-50 transition-colors">
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
                              <FormLabel className="font-normal w-full cursor-pointer leading-tight">
                                {item.label}
                                {item.id === 'other' && field.value?.includes('other') && (
                                  <Input 
                                    className="mt-2 h-10" 
                                    placeholder="โปรดระบุ" 
                                    onChange={(e) => form.setValue('legalProblemsOther', e.target.value)}
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

              <FormField
                control={form.control}
                name="initialHandling"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">ปัจจุบัน หากมีปัญหาด้านเอกสารหรือข้อพิพาท ท่านมีวิธีจัดการอย่างไรในเบื้องต้น?</FormLabel>
                    <FormControl>
                      <Textarea placeholder="เช่น ปรึกษาคนรู้จัก, ค้นหาข้อมูลเองจาก Google, ยอมความ..." className="min-h-[100px] resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hiringObstacles"
                render={() => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-base font-semibold">อุปสรรคสำคัญที่ทำให้ท่านลังเลที่จะจ้างทนายความอิสระ (เลือกได้มากกว่า 1 ข้อ)</FormLabel>
                    <div className="grid gap-3">
                      {HIRING_OBSTACLES.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="hiringObstacles"
                          render={({ field }) => (
                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 hover:bg-slate-50 transition-colors">
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
                              <FormLabel className="font-normal w-full cursor-pointer leading-tight">
                                {item.label}
                                {item.id === 'other' && field.value?.includes('other') && (
                                  <Input 
                                    className="mt-2 h-10" 
                                    placeholder="โปรดระบุ" 
                                    onChange={(e) => form.setValue('hiringObstaclesOther', e.target.value)}
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
            </div>

            {/* Section 3: Tech Acceptance */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b pb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">3</span>
                <h3 className="text-xl font-bold text-slate-800">การยอมรับเทคโนโลยีและการแก้ปัญหา</h3>
              </div>

              <FormField
                control={form.control}
                name="aiHelpfulness"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-base font-semibold">
                      หากมีระบบ AI ช่วยวิเคราะห์ความเสี่ยงสัญญาก่อนส่งให้ทนาย ท่านคิดว่าจะช่วยประหยัดเวลา/ทรัพยากรได้แค่ไหน?
                      <span className="block text-sm font-normal text-slate-500 mt-1">(1 = ไม่ช่วยเลย, 5 = ช่วยได้มากที่สุด)</span>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex justify-between md:max-w-md mx-auto py-4"
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <FormItem key={val} className="flex flex-col items-center space-y-2">
                            <FormControl><RadioGroupItem value={val.toString()} className="h-6 w-6" /></FormControl>
                            <FormLabel className="font-bold text-lg">{val}</FormLabel>
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
                name="preferredChannel"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-base font-semibold">ท่านถนัดใช้งานเครื่องมือผ่านช่องทางใดมากที่สุด?</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} className="grid gap-3">
                        {[
                          { id: 'web', label: 'เว็บไซต์ผ่านคอมพิวเตอร์สำนักงาน' },
                          { id: 'app', label: 'แอปพลิเคชันบนมือถือ' },
                          { id: 'chat', label: 'ระบบแชท (เช่น LINE OA หรือระบบแชทในเว็บ)' }
                        ].map((item) => (
                          <FormItem key={item.id} className="flex items-center space-x-3 space-y-0 rounded-xl border p-4">
                            <FormControl><RadioGroupItem value={item.id} /></FormControl>
                            <FormLabel className="font-normal w-full cursor-pointer">{item.label}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 4: UX & Subscription */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b pb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">4</span>
                <h3 className="text-xl font-bold text-slate-800">ประสบการณ์ผู้ใช้และสิ่งที่กระตุ้นให้เกิดการใช้งาน</h3>
              </div>

              <FormField
                control={form.control}
                name="confidenceFactor"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-base font-semibold">ข้อมูลส่วนใดที่จะทำให้ท่านมั่นใจที่สุดในการเลือกจ้างทนายออนไลน์?</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} className="grid gap-3">
                        {[
                          { id: 'license', label: 'มีการแสดงประวัติและใบอนุญาตทนายความที่ชัดเจน' },
                          { id: 'review', label: 'มีระบบรีวิวและให้คะแนนจากผู้ประกอบการรายอื่น' },
                          { id: 'ai_suggest', label: 'มีระบบ AI ช่วยแนะนำทนายความให้ตรงกับปัญหาโดยอัตโนมัติ' },
                          { id: 'pricing', label: 'มีตารางเปรียบเทียบราคาและขอบเขตงานที่ชัดเจน' }
                        ].map((item) => (
                          <FormItem key={item.id} className="flex items-center space-x-3 space-y-0 rounded-xl border p-4">
                            <FormControl><RadioGroupItem value={item.id} /></FormControl>
                            <FormLabel className="font-normal w-full cursor-pointer leading-tight">{item.label}</FormLabel>
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
                name="subscriptionInterest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">หากมีแพ็กเกจ Subscription รายเดือน/รายปี ฟีเจอร์ใดที่ทำให้ท่านรู้สึกคุ้มค่าและยินดีที่จะจ่าย?</FormLabel>
                    <FormControl>
                      <Textarea placeholder="ระบุฟีเจอร์หรือความคุ้มค่าที่ท่านคาดหวัง..." className="min-h-[120px] resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg font-bold rounded-2xl shadow-lg transition-all active:scale-95" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  กำลังส่งข้อมูล...
                </>
              ) : (
                'ส่งแบบสอบถาม'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

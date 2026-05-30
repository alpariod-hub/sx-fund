import { useState } from "react";
import { useGetPoolSummary, useListTranches, useSubmitInvestorInquiry, useListAssets } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Layers, Send, Twitter, Linkedin, Mail } from "lucide-react";

const inquirySchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  investorType: z.enum(['institutional', 'crypto', 'family_office', 'individual']),
  interestedTranche: z.enum(['DROP', 'TIN', 'both']),
  message: z.string().optional()
});

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;
type ContactFormValues = z.infer<typeof contactSchema>;

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Landing() {
  const { data: poolSummary, isLoading: isSummaryLoading } = useGetPoolSummary();
  const { data: tranches, isLoading: isTranchesLoading } = useListTranches();
  const { data: assets, isLoading: isAssetsLoading } = useListAssets();
  const submitInquiry = useSubmitInvestorInquiry();
  const { toast } = useToast();
  const [contactPending, setContactPending] = useState(false);

  const inquiryForm = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      investorType: "institutional",
      interestedTranche: "both",
      message: ""
    }
  });

  const contactForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" }
  });

  const onInquirySubmit = (data: InquiryFormValues) => {
    submitInquiry.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Inquiry submitted", description: "Our team will contact you shortly." });
          inquiryForm.reset();
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error submitting inquiry", description: "Please try again later." });
        }
      }
    );
  };

  const onContactSubmit = async (data: ContactFormValues) => {
    setContactPending(true);
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
      contactForm.reset();
    } catch {
      toast({ variant: "destructive", title: "Error sending message", description: "Please try again later." });
    } finally {
      setContactPending(false);
    }
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold font-mono">
              SX
            </div>
            <span className="font-bold tracking-wider font-mono">SX FUND</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => document.getElementById('pools')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors">Pools</button>
            <button onClick={() => document.getElementById('tranches')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors">Tranches</button>
            <button onClick={() => document.getElementById('invest')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors">Invest</button>
            <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors">Contact</button>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">Admin</Button>
            </Link>
            <Button onClick={() => document.getElementById('invest')?.scrollIntoView({ behavior: 'smooth' })}>
              Invest Now
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-24">
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 md:py-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
          <motion.div className="max-w-4xl relative z-10" initial="initial" animate="animate" variants={fadeIn}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-8 uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Live on Polygon
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-foreground leading-[1.1]">
              Institutional RWA <br />
              <span className="text-muted-foreground">Trade Finance.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              SX Fund bridges institutional capital with DeFi infrastructure.
              We tokenize real Ukrainian agricultural trade receivables into high-yield, collateralized on-chain assets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="h-12 px-8 text-lg font-medium" onClick={() => document.getElementById('invest')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore Pool
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg font-medium" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                Contact Us
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-card/30">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-mono">Total Value Locked</p>
                {isSummaryLoading ? <Skeleton className="h-10 w-32" /> : (
                  <div className="text-4xl font-mono font-bold text-foreground">${poolSummary?.totalTvl.toLocaleString()}</div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-mono">Average Yield</p>
                {isSummaryLoading ? <Skeleton className="h-10 w-24" /> : (
                  <div className="text-4xl font-mono font-bold text-primary">{poolSummary?.averageYield}% <span className="text-lg text-muted-foreground">APY</span></div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-mono">Active Assets</p>
                {isSummaryLoading ? <Skeleton className="h-10 w-16" /> : (
                  <div className="text-4xl font-mono font-bold">{poolSummary?.activeAssets}</div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider font-mono">Infrastructure</p>
                <div className="text-2xl font-bold flex items-center gap-2 pt-1">Centrifuge</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Assets */}
        <section id="pools" className="py-24 container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Tokenized Receivables</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Real-world agricultural contracts structured as NFTs on Polygon, providing transparent collateral for the lending pool.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {isAssetsLoading ? (
              Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
            ) : assets?.slice(0, 2).map((asset) => (
              <Card key={asset.id} className="bg-card/50 border-border/60 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="px-2 py-1 rounded bg-muted text-xs font-mono text-muted-foreground uppercase">{asset.assetType.replace('_', ' ')}</div>
                    <div className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-mono uppercase">{asset.status}</div>
                  </div>
                  <CardTitle className="text-2xl font-mono">{asset.tokenId}</CardTitle>
                  <CardDescription className="text-base">{asset.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground font-mono uppercase mb-1">Principal</p>
                      <p className="font-mono font-medium">{asset.loanCurrency} {asset.principal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono uppercase mb-1">Yield</p>
                      <p className="font-mono font-medium text-primary">{asset.yieldMin}% - {asset.yieldMax}% APY</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono uppercase mb-1">Term</p>
                      <p className="font-mono font-medium">{asset.term}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono uppercase mb-1">Commodity</p>
                      <p className="font-mono font-medium capitalize">{asset.commodity || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tranche Structure */}
        <section id="tranches" className="py-24 bg-card/30 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Tranche Architecture</h2>
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                  SX Fund utilizes Centrifuge's standard two-tranche structure, allowing investors to choose their preferred risk-return profile.
                </p>
                <div className="space-y-6">
                  {isTranchesLoading ? (
                    Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
                  ) : tranches?.map((tranche) => (
                    <div key={tranche.id} className="flex gap-4 p-6 rounded-lg border border-border bg-background/50">
                      <div className="shrink-0 pt-1">
                        <div className={`w-3 h-3 rounded-full ${tranche.type === 'DROP' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl mb-1 flex items-center gap-2">
                          {tranche.name} <span className="text-sm font-normal text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded uppercase">{tranche.priority}</span>
                        </h3>
                        <p className="text-muted-foreground mb-4 text-sm">{tranche.description}</p>
                        <div className="flex gap-6">
                          <div>
                            <span className="text-xs text-muted-foreground font-mono uppercase block mb-1">Target Yield</span>
                            <span className="font-mono font-bold text-primary">{tranche.yieldMin}% - {tranche.yieldMax}%</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground font-mono uppercase block mb-1">Allocation</span>
                            <span className="font-mono font-bold">{tranche.allocation}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-lg border border-border bg-background/50 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4"><Shield className="w-6 h-6" /></div>
                  <h4 className="font-bold mb-2">Overcollateralized</h4>
                  <p className="text-sm text-muted-foreground">Loans are strictly overcollateralized by real-world assets with verifiable on-chain oracle events.</p>
                </div>
                <div className="p-6 rounded-lg border border-border bg-background/50 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4"><Layers className="w-6 h-6" /></div>
                  <h4 className="font-bold mb-2">Loss Protection</h4>
                  <p className="text-sm text-muted-foreground">TIN tranche absorbs first losses, protecting DROP investors and ensuring senior capital safety.</p>
                </div>
                <div className="p-6 rounded-lg border border-border bg-background/50 flex flex-col items-center text-center sm:col-span-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4"><Lock className="w-6 h-6" /></div>
                  <h4 className="font-bold mb-2">Institutional Grade Security</h4>
                  <p className="text-sm text-muted-foreground max-w-md">Fund administration managed via Gnosis Safe multi-sig, with smart contracts audited by leading security firms.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Investor Inquiry Form */}
        <section id="invest" className="py-24 container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Investor Inquiry</h2>
            <p className="text-muted-foreground">Express interest in SX Fund. Our team will contact you with detailed offering documents and onboarding instructions.</p>
          </div>
          <Card className="bg-card/50 border-border/60">
            <CardContent className="p-6 sm:p-10">
              <Form {...inquiryForm}>
                <form onSubmit={inquiryForm.handleSubmit(onInquirySubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={inquiryForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={inquiryForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Email</FormLabel>
                        <FormControl><Input type="email" placeholder="john@company.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={inquiryForm.control} name="company" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company / Organization (Optional)</FormLabel>
                      <FormControl><Input placeholder="Acme Capital" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={inquiryForm.control} name="investorType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investor Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="institutional">Institutional</SelectItem>
                            <SelectItem value="family_office">Family Office</SelectItem>
                            <SelectItem value="crypto">Crypto Fund</SelectItem>
                            <SelectItem value="individual">Accredited Individual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={inquiryForm.control} name="interestedTranche" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interested Tranche</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select tranche" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DROP">DROP (Senior - Lower Risk)</SelectItem>
                            <SelectItem value="TIN">TIN (Junior - Higher Yield)</SelectItem>
                            <SelectItem value="both">Both / Undecided</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={inquiryForm.control} name="message" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any specific questions or investment size expectations..." className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" size="lg" className="w-full text-lg" disabled={submitInquiry.isPending}>
                    {submitInquiry.isPending ? "Submitting..." : "Submit Inquiry"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </section>

        {/* Contact / General Inquiries */}
        <section id="contact" className="py-24 bg-card/30 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 max-w-5xl mx-auto">
              {/* Info */}
              <div>
                <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
                <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
                  Questions about the fund structure, KYC requirements, or partnership opportunities? Our team is here to help.
                </p>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Telegram</p>
                      <a href="https://t.me/sx_fundBot" target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono">@sx_fundBot</a>
                      <p className="text-sm text-muted-foreground mt-1">Fastest response — usually within 1 hour</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Email</p>
                      <a href="mailto:contact@trinityfund.io" className="text-primary hover:underline font-mono">contact@trinityfund.io</a>
                      <p className="text-sm text-muted-foreground mt-1">For formal inquiries and documentation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Legal Address</p>
                      <p className="text-muted-foreground font-mono text-sm">To be confirmed</p>
                      <p className="text-sm text-muted-foreground mt-1">Registered legal entity in progress</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <Card className="bg-background/50 border-border/60">
                  <CardContent className="p-6 sm:p-8">
                    <h3 className="text-xl font-bold mb-6">Send a Message</h3>
                    <Form {...contactForm}>
                      <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <FormField control={contactForm.control} name="name" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={contactForm.control} name="email" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl><Input type="email" placeholder="john@company.com" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={contactForm.control} name="subject" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl><Input placeholder="KYC requirements / Partnership / General" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={contactForm.control} name="message" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Your message..." className="min-h-[120px]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <Button type="submit" className="w-full gap-2" disabled={contactPending}>
                          <Send className="w-4 h-4" />
                          {contactPending ? "Sending..." : "Send Message"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12 text-muted-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold font-mono">SX</div>
                <span className="font-bold text-foreground tracking-wider font-mono">SX FUND</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                Institutional RWA trade finance platform. Tokenizing Ukrainian agricultural receivables on Polygon.
              </p>
            </div>
            {/* Links */}
            <div>
              <p className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider font-mono">Platform</p>
              <div className="space-y-2 text-sm">
                <button onClick={() => document.getElementById('pools')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-foreground transition-colors">Pools</button>
                <button onClick={() => document.getElementById('tranches')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-foreground transition-colors">Tranches</button>
                <button onClick={() => document.getElementById('invest')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-foreground transition-colors">Investor Inquiry</button>
                <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="block hover:text-foreground transition-colors">Contact</button>
              </div>
            </div>
            {/* Social */}
            <div>
              <p className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider font-mono">Connect</p>
              <div className="flex gap-3 mb-4">
                <a href="https://t.me/sx_fundBot" target="_blank" rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </a>
                <a href="https://twitter.com/sxfund" target="_blank" rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="https://linkedin.com/company/sxfund" target="_blank" rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="mailto:contact@trinityfund.io"
                  className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/50 hover:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
              <div className="text-xs space-y-1">
                <p className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">Terms of Service</p>
                <p className="hover:text-foreground cursor-pointer transition-colors">KYC / AML Policy</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p>© {new Date().getFullYear()} SX Fund. All rights reserved.</p>
            <p className="text-center max-w-xl opacity-60">
              This website is for informational purposes only and does not constitute an offer to sell or a solicitation of an offer to buy any securities. Investment involves significant risk, including total loss of principal.
            </p>
          </div>
        </div>
      </footer>

      {/* Telegram Floating Widget */}
      <a
        href="https://t.me/sx_fundBot"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-full px-4 py-3 shadow-lg transition-all hover:scale-105 group"
        title="Contact us on Telegram"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        <span className="text-sm font-medium">Contact us</span>
      </a>
    </div>
  );
}

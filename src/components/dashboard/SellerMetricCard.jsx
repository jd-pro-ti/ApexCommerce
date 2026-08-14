import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function SellerMetricCard({ label, value, detail, icon: Icon, iconClass, href, detailClass = 'text-slate-500' }) {
  const content = (
    <div className={`group bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 transition-all duration-300 ${href ? 'hover:bg-white hover:-translate-y-1 cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform ${iconClass}`}><Icon className="w-5 h-5" /></div>
      </div>
      <div className="text-3xl font-bold text-slate-800 tracking-tight">{value}</div>
      <div className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${detailClass}`}>
        {detail}
        {href && <ArrowUpRight className="w-3.5 h-3.5 ml-auto" />}
      </div>
    </div>
  );

  return href ? <Link href={href} aria-label={`Ver ${label}`}>{content}</Link> : content;
}

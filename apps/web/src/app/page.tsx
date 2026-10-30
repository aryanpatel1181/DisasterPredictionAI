'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowUpRight, ArrowDown, Activity, Radio, Layers, Search, RefreshCw, Download, X, ExternalLink, ShieldCheck, CloudRain } from 'lucide-react';
import type { Signal } from '@/components/Observatory/SignalMap';
const InteractiveGlobe = dynamic(() => import('@/components/Hero/InteractiveGlobe'), { ssr: false, loading: () => <div className="orbital-art"><div className="planet"/><span className="art-note">PREPARING YOUR PLANET</span></div> });
const SignalMap = dynamic(() => import('@/components/Observatory/SignalMap'), { ssr: false, loading: () => <div className="map-loading">Preparing the global map…</div> });

export default function Home() {
  const [events,setEvents]=useState<Signal[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [updated,setUpdated]=useState('');
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('all');
  const [selected,setSelected]=useState<Signal|null>(null);
  const [view,setView]=useState('observations');
  const refresh=useCallback(async()=>{
    setLoading(true);
    try {
      const response=await fetch('/api/v1/events?limit=100&enable_clustering=false',{signal:AbortSignal.timeout(45000)});
      if(!response.ok) throw new Error('The feed is temporarily unavailable.');
      const body=await response.json();
      setEvents(body.events||[]); setUpdated(new Date().toLocaleTimeString());setError('');
    } catch {setError('Unable to refresh the feed. Previously loaded records remain visible. Try again shortly.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{refresh();const timer=setInterval(refresh,120000);return()=>clearInterval(timer);},[refresh]);
  useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setSelected(null);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[]);
  const filtered=useMemo(()=>events.filter(e=>
    (view==='predictions'?e.status==='AI_RISK_ESTIMATE':e.status!=='AI_RISK_ESTIMATE')&&
    (category==='all'||e.hazard_type===category)&&
    ((e.country||'')+' '+(e.nearest_populated_location||'')).toLowerCase().includes(search.toLowerCase())
  ),[events,view,category,search]);
  const counts=events.reduce<Record<string,number>>((acc,e)=>{acc[e.hazard_type]=(acc[e.hazard_type]||0)+1;return acc;},{});
  function download(){const blob=new Blob([JSON.stringify(filtered,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='terraguard-signals.json';a.click();URL.revokeObjectURL(url);}
  return <div className="tg-page">
    <section className="tg-hero">
      <div className="tg-hero-copy"><p className="eyebrow"><span className="status-dot"/> PLANET-SCALE PERSPECTIVE</p>
        <h1>A changing planet.<br/><em>A clearer picture.</em></h1>
        <p className="hero-byline">Built by <span>Aryan</span> and AI</p>
        <p className="hero-description">Connect the signals. Understand the context. Explore environmental intelligence with the evidence always in view.</p>
        <div className="hero-actions"><a className="tg-button primary" href="#monitor">Open the observatory <ArrowDown size={16}/></a><Link className="text-link" href="/about">Explore the engineering <ArrowUpRight size={16}/></Link></div>
        <div className="hero-caption"><ShieldCheck size={15}/> Transparent sources. Clearly defined uncertainty.</div>
      </div>
      <InteractiveGlobe/>
    </section>
    <div className="source-ribbon"><span>BUILT AROUND OPEN DATA</span><strong>USGS</strong><strong>GDACS</strong><strong>WMO / CAP</strong><span className="ribbon-note">Source availability is shown per record ↗</span></div>
    <section id="monitor" className="observatory">
      <div className="section-heading"><div><p className="eyebrow">01 / THE OBSERVATORY</p><h2>Global signals, in context.</h2></div><button className="tg-button" disabled={loading} onClick={refresh}><RefreshCw size={14} className={loading?'spin':''}/>{loading?'Refreshing':'Refresh data'}</button></div>
      <div className="metric-row">
        {[['Records loaded',events.length,'Up to 100 latest records',Activity],['Hazard categories',Object.keys(counts).length,'Across the current feed',Layers],['Forecast research',events.filter(e=>e.status==='AI_RISK_ESTIMATE').length,'Synthetic model demonstrations',CloudRain],['Last refresh',updated||'—','Updates every two minutes',Radio]].map(([label,value,note,Icon]:any)=><div className="metric" key={label}><div><span>{label}</span><Icon size={17}/></div><strong>{value}</strong><small>{note}</small></div>)}
      </div>
      <div className="monitor-toolbar"><div className="view-switch" aria-label="Signal view"><button aria-pressed={view==='observations'} className={view==='observations'?'active':''} onClick={()=>setView('observations')}>Observations</button><button aria-pressed={view==='predictions'} className={view==='predictions'?'active':''} onClick={()=>setView('predictions')}>Forecast lab <span>RESEARCH</span></button></div><label className="signal-search"><Search size={16}/><input aria-label="Search signals by location" placeholder="Search a location…" value={search} onChange={e=>setSearch(e.target.value)}/></label><button aria-label="Export filtered signals as JSON" title="Export JSON" className="icon-button" onClick={download}><Download size={17}/></button></div>
      {error&&<div role="alert" className="feed-notice">{error}</div>}
      {view==='predictions'&&<div className="feed-notice">Research sandbox: these scenarios use synthetic training data and illustrative inputs. They are not validated forecasts or official warnings.</div>}
      <div className="monitor-grid"><div className="map-card"><SignalMap events={filtered} selected={selected} onSelect={setSelected}/><div className="map-legend"><span><i/>Event location</span><span>Pan, zoom, or select a signal</span></div></div>
      <aside className="signal-panel"><div className="signal-panel-title"><h3>Signal feed</h3><span>{filtered.length} RECORDS</span></div><select aria-label="Hazard category" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All hazard categories</option>{Object.keys(counts).map(kind=><option value={kind} key={kind}>{kind.replaceAll('_',' ')}</option>)}</select>
        <div className="signal-list">{!filtered.length&&<div className="empty-state">{loading?'Connecting to data sources…':'No signals match this view.'}</div>}{filtered.map(e=><button className={'signal-row '+(selected?.event_id===e.event_id?'selected':'')} key={e.event_id} onClick={()=>setSelected(e)}><span className="signal-kind">{e.hazard_type.replaceAll('_',' ')}<span className={'severity '+e.severity.toLowerCase()}>{e.severity}</span></span><strong>{e.country||e.nearest_populated_location||'Location unavailable'}</strong><span className="signal-location">{e.nearest_populated_location}</span><span className="signal-meta">{isSample(e)?'SAMPLE / RESEARCH':e.status.replaceAll('_',' ')}<ArrowUpRight size={14}/></span></button>)}</div>
      </aside></div>
      {selected&&<section className="signal-detail" aria-label="Selected signal evidence"><button className="detail-close icon-button" aria-label="Close event detail" onClick={()=>setSelected(null)}><X size={18}/></button><p className="eyebrow">SELECTED SIGNAL / {isSample(selected)?'DEMONSTRATION':selected.status}</p><h3>{selected.country||selected.nearest_populated_location}</h3><p>{selected.explanation?.human_summary||'No explanation was supplied by this source.'}</p><div className="detail-facts"><span>Location <b>{selected.latitude.toFixed(2)}°, {selected.longitude.toFixed(2)}°</b></span><span>Severity <b>{selected.severity}</b></span><span>Model / processing <b>{selected.model_version||'Not supplied'}</b></span><span>Source <b>{selected.sources?.map(s=>s.provider).join(', ')||'Not supplied'}</b></span></div>{selected.explanation?.primary_drivers?.length?<div className="driver-row">{selected.explanation.primary_drivers.map(d=><div key={d.feature}><span>{d.feature.replaceAll('_',' ')}</span><strong>{d.value} <small>{d.unit}</small></strong></div>)}</div>:null}</section>}
    </section>
    <section className="tg-story"><div><p className="eyebrow">02 / BUILT FOR UNDERSTANDING</p><h2>Evidence first.<br/>Every step of the way.</h2><p>From an earthquake observation to a model experiment, knowing where a number comes from matters as much as the number itself.</p><Link href="/about" className="text-link">Read the project notes <ArrowUpRight size={16}/></Link></div><div className="story-cards">{[[Radio,'Source-aware ingestion','Modular provider adapters normalize external records and keep provenance attached.'],[Layers,'Explainable research','Inspect the inputs behind flood model experiments, with synthetic data explicitly identified.'],[ShieldCheck,'Clear boundaries','Observations, forecasts, and official alerts carry separate labels throughout the experience.']].map(([Icon,title,description]:any)=><article key={title}><Icon size={22}/><div><h3>{title}</h3><p>{description}</p></div></article>)}</div></section>
  </div>;
}
function isSample(e:Signal){return e.status==='AI_RISK_ESTIMATE'||/mock|demo|sample/i.test(e.event_id)||e.sources?.some(s=>/mock|demo|synthetic/i.test(s.provider));}


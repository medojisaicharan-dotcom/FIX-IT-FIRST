/**
 * Fix It First — The Canvas Protocol Edition 🎨
 * "Think before you throw."
 *
 * Core Interaction Model:
 * - ZERO standard action buttons for primary features.
 * - Primary actions executed EXCLUSIVELY by dragging data cards into Action Zones.
 * - Touch & Mouse unified Pointer Events engine for seamless mobile & desktop support.
 */

(function () {
  'use strict';

  // --- APPLICATION STATE ---
  const state = {
    theme: localStorage.getItem('fif_theme') || 'dark',
    contrast: localStorage.getItem('fif_contrast') || 'normal',
    activeItem: null,
    evaluation: null,
    activeActionPlan: null,
    showComparison: false,
    favorites: JSON.parse(localStorage.getItem('fif_favorites') || '[]'),
    sessionHistory: [],
    customItemModal: false,
    stagedCustomItem: {
      name: 'Custom Broken Item',
      category: 'furniture',
      age: 3,
      condition: 'good',
      severity: 'moderate',
      sentimental: false,
      replaceCost: 180
    }
  };

  // --- PRESET DATA CARDS ---
  const PRESET_CARDS = [
    {
      id: 'item-chair',
      name: 'Wobbly Office Chair',
      category: 'furniture',
      icon: '🪑',
      age: 4,
      condition: 'good',
      severity: 'moderate',
      sentimental: false,
      replaceCost: 180,
      description: 'Cylinder slowly sinks over an hour, and base bolts have play.'
    },
    {
      id: 'item-blender',
      name: 'Sputtering Blender',
      category: 'appliance',
      icon: '🔌',
      age: 2,
      condition: 'good',
      severity: 'minor',
      sentimental: false,
      replaceCost: 120,
      description: 'Motor runs intermittently; blade gasket appears worn and stiff.'
    },
    {
      id: 'item-phone',
      name: 'Cracked Smartphone',
      category: 'electronics',
      icon: '📱',
      age: 3,
      condition: 'fair',
      severity: 'severe',
      sentimental: false,
      replaceCost: 450,
      description: 'Front glass shattered, touch sensor unresponsive in lower corner.'
    },
    {
      id: 'item-jacket',
      name: 'Winter Parka',
      category: 'clothing',
      icon: '👕',
      age: 2,
      condition: 'good',
      severity: 'minor',
      sentimental: true,
      replaceCost: 160,
      description: 'Zipper slider jumped the track; fabric and down fill in mint shape.'
    }
  ];

  // --- SCORING ENGINE ---
  function evaluateItem(item) {
    const age = Math.max(0.1, Number(item.age) || 1);
    const cond = item.condition;
    const sev = item.severity;
    const isSentimental = Boolean(item.sentimental);
    const cat = item.category;
    const replaceCost = Math.max(10, Number(item.replaceCost) || 150);

    let sRepair = 55;
    let sReuse = 45;
    let sRepurpose = 40;
    let sReplace = 30;
    let sRecycle = 35;

    // Condition
    if (cond === 'excellent') {
      sRepair += 20; sReuse += 35; sRepurpose -= 10; sReplace -= 25; sRecycle -= 20;
    } else if (cond === 'good') {
      sRepair += 15; sReuse += 20; sRepurpose += 5; sReplace -= 15; sRecycle -= 10;
    } else if (cond === 'fair') {
      sRepair += 5; sReuse -= 5; sRepurpose += 20; sReplace += 10; sRecycle += 15;
    } else if (cond === 'poor') {
      sRepair -= 20; sReuse -= 30; sRepurpose += 25; sReplace += 30; sRecycle += 35;
    }

    // Severity
    if (sev === 'minor') {
      sRepair += 25; sReuse += 20; sReplace -= 25; sRecycle -= 20;
    } else if (sev === 'moderate') {
      sRepair += 15; sReuse -= 5; sRepurpose += 15; sReplace += 5; sRecycle += 10;
    } else if (sev === 'severe') {
      sRepair -= 20; sReuse -= 35; sRepurpose += 25; sReplace += 30; sRecycle += 35;
    }

    // Age
    if (age <= 2) {
      sRepair += 20; sReuse += 15; sReplace -= 25; sRecycle -= 15;
    } else if (age <= 5) {
      sRepair += 10; sReuse += 5; sReplace -= 10;
    } else if (age <= 10) {
      sRepair -= 5; sRepurpose += 15; sReplace += 15; sRecycle += 15;
    } else {
      sRepair -= 15; sRepurpose += 25; sReplace += 25; sRecycle += 25;
    }

    // Sentimental
    if (isSentimental) {
      sRepair += 25; sRepurpose += 20; sReplace -= 30; sRecycle -= 25;
    }

    const clamp = (val) => Math.min(96, Math.max(8, Math.round(val)));
    sRepair = clamp(sRepair);
    sReuse = clamp(sReuse);
    sRepurpose = clamp(sRepurpose);
    sReplace = clamp(sReplace);
    sRecycle = clamp(sRecycle);

    const repairCostMin = Math.max(5, Math.round(replaceCost * (sev === 'minor' ? 0.08 : sev === 'moderate' ? 0.18 : 0.4)));
    const repairCostMax = Math.max(repairCostMin + 15, Math.round(replaceCost * (sev === 'minor' ? 0.16 : sev === 'moderate' ? 0.32 : 0.65)));
    const savings = Math.max(15, Math.round(replaceCost - (repairCostMin + repairCostMax) / 2));
    const co2Saved = Math.round((cat === 'furniture' ? 42 : cat === 'appliance' ? 80 : cat === 'clothing' ? 18 : 55) * (sev === 'minor' ? 1.0 : 0.85));

    const options = {
      repair: {
        key: 'repair',
        name: 'Repair',
        score: sRepair,
        icon: '🔧',
        color: '#10b981',
        zoneClass: 'zone-portal-repair',
        why: `With ${sev} wear, fixing the faulty hardware saves ~$${savings} and extends structural life.`,
        cost: `$${repairCostMin} – $${repairCostMax}`,
        time: sev === 'minor' ? '20–45 mins' : '1–2 hours',
        difficulty: sev === 'minor' ? 'Easy' : 'Moderate',
        eco: `Diverts ~${co2Saved} kg CO₂`,
        checklist: [
          'Isolate power or clear mechanical obstruction',
          'Inspect fasteners and replace sheared dowels/screws',
          'Apply adhesive or fresh lubricant to moving joints',
          'Tighten hardware evenly in cross-pattern and test under load'
        ]
      },
      reuse: {
        key: 'reuse',
        name: 'Reuse / Pass Along',
        score: sReuse,
        icon: '🔄',
        color: '#0ea5e9',
        zoneClass: 'zone-portal-reuse',
        why: `Solid core condition makes this ideal to re-home via community gifting or secondhand circulation.`,
        cost: '$0 – $10 (cleaning)',
        time: '15–30 mins',
        difficulty: 'Very Easy',
        eco: '100% material life extension',
        checklist: [
          'Sanitize and wipe down all surfaces',
          'Post on local Freecycle or Buy Nothing community board',
          'Document minor quirks honestly for the next owner',
          'Arrange contactless porch pickup'
        ]
      },
      repurpose: {
        key: 'repurpose',
        name: 'Repurpose / Upcycle',
        score: sRepurpose,
        icon: '✨',
        color: '#a855f7',
        zoneClass: 'zone-portal-repurpose',
        why: `High-value raw materials are preserved and repurposed into a unique new functional piece.`,
        cost: '$5 – $25 (craft supplies)',
        time: '1–3 hours',
        difficulty: 'Medium',
        eco: 'Zero waste generation',
        checklist: [
          'Disassemble irreparable elements safely',
          'Sand, seal, or trim structural wood/metal/fabric',
          'Assemble into new utility (planter, shelf, pet bed, organizer)',
          'Finish with non-toxic protective seal'
        ]
      },
      replace: {
        key: 'replace',
        name: 'Replace (Sustainable Choice)',
        score: sReplace,
        icon: '🛍️',
        color: '#f59e0b',
        zoneClass: 'zone-portal-replace',
        why: `Replacing is only recommended when repair costs exceed 70% of new unit value or critical safety is breached.`,
        cost: `~$${replaceCost}`,
        time: '1–2 days',
        difficulty: 'Easy',
        eco: 'Consumes new manufacturing resources',
        checklist: [
          'Look for certified refurbished or modular models first',
          'Check iFixit repairability rating before buying',
          'Confirm spare parts availability for at least 5 years',
          'Drop off the old unit at an authorized recycling depot'
        ]
      },
      recycle: {
        key: 'recycle',
        name: 'Recycle / Discard',
        score: sRecycle,
        icon: '♻️',
        color: '#94a3b8',
        zoneClass: 'zone-portal-recycle',
        why: `Recovers metals, rare elements, and clean plastics rather than feeding landfill waste streams.`,
        cost: '$0 (municipal drop-off)',
        time: '30–45 mins',
        difficulty: 'Easy',
        eco: 'Recovers circular raw feedstock',
        checklist: [
          'Separate batteries, capacitors, and electronic components',
          'Locate certified municipal e-waste / scrap collection facility',
          'Bundle wiring and cords securely',
          'Deliver during scheduled waste drop-off hours'
        ]
      }
    };

    const ranked = Object.values(options).sort((a, b) => b.score - a.score);
    ranked.forEach((o, i) => { o.rank = i + 1; });

    return {
      item,
      ranked,
      options,
      topOption: ranked[0],
      savings,
      co2Saved,
      replaceCost,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // --- RENDER MAIN CANVAS INTERFACE ---
  function renderCanvas() {
    applyTheme();
    const appEl = document.getElementById('mainContent');
    if (!appEl) return;

    appEl.innerHTML = `
      <!-- Canvas Protocol Live Alert Banner -->
      <div class="mb-6 p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-lg">
        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
          <div>
            <strong class="text-sm font-black text-white tracking-wide uppercase">The Canvas Protocol is Active</strong>
            <p class="text-emerald-400/90 mt-0.5">Primary buttons are disabled. Drag data cards into Action Zones to analyze, decide, and save.</p>
          </div>
        </div>
        <div class="flex items-center gap-2 text-[11px] font-mono bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-700/50">
          <span>🖐️ Drag & Drop Interface</span>
        </div>
      </div>

      <!-- Two-Column Interactive Canvas Workspace -->
      <div class="canvas-board">
        
        <!-- LEFT COLUMN: Draggable Cards Deck & Modifier Tokens -->
        <div class="flex flex-col gap-6">
          
          <!-- Section A: Staging Deck -->
          <div class="glass-panel p-5 rounded-3xl">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
                <span>🎴 Data Cards Deck</span>
              </h3>
              <span class="text-[10px] text-emerald-400 font-bold">Drag card to target</span>
            </div>
            <p class="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
              Touch and drag any card into the <strong>Diagnostic Chamber</strong> to begin.
            </p>

            <div class="space-y-3" id="deckContainer">
              ${PRESET_CARDS.map(card => `
                <div 
                  class="draggable-card" 
                  data-card-type="item" 
                  data-item-id="${card.id}"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <span class="text-lg">${card.icon}</span>
                      <span>${escapeHtml(card.name)}</span>
                    </span>
                    <span class="drag-indicator">Drag ➔</span>
                  </div>
                  <p class="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    ${card.description}
                  </p>
                  <div class="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-faint)]">
                    <span class="capitalize">${card.condition} condition</span>
                    <span>${card.age} yrs old</span>
                  </div>
                </div>
              `).join('')}

              <!-- Custom Item Card -->
              <div 
                class="draggable-card border-dashed border-emerald-500/50 bg-emerald-950/20 hover:border-emerald-400" 
                data-card-type="item" 
                data-item-id="custom-item"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span class="text-lg">✨</span>
                    <span id="customCardName">${escapeHtml(state.stagedCustomItem.name)}</span>
                  </span>
                  <span class="drag-indicator">Drag ➔</span>
                </div>
                <p class="text-[11px] text-[var(--text-muted)]">
                  Custom item (${state.stagedCustomItem.age} yrs · ${state.stagedCustomItem.condition} condition)
                </p>
              </div>
            </div>
          </div>

          <!-- Section B: Modifier Tokens (Drag onto active item) -->
          <div class="glass-panel p-5 rounded-3xl">
            <h3 class="text-xs font-black uppercase tracking-wider text-[var(--text-main)] mb-2">
              🧪 Diagnostic Modifier Tokens
            </h3>
            <p class="text-xs text-[var(--text-muted)] mb-3">
              Drag a token into the <strong>Diagnostic Chamber</strong> to live-tweak the active item.
            </p>

            <div class="flex flex-wrap gap-2" id="tokenDeck">
              <div class="drag-modifier-chip" data-card-type="modifier" data-mod-type="severity" data-mod-val="severe">
                <span>⚡</span> <span>Severe Damage</span>
              </div>
              <div class="drag-modifier-chip" data-card-type="modifier" data-mod-type="severity" data-mod-val="minor">
                <span>🟢</span> <span>Minor Scratches</span>
              </div>
              <div class="drag-modifier-chip" data-card-type="modifier" data-mod-type="condition" data-mod-val="excellent">
                <span>✨</span> <span>Like New Frame</span>
              </div>
              <div class="drag-modifier-chip" data-card-type="modifier" data-mod-type="sentimental" data-mod-val="true">
                <span>💎</span> <span>Sentimental Heirloom</span>
              </div>
              <div class="drag-modifier-chip" data-card-type="modifier" data-mod-type="age" data-mod-val="addYear">
                <span>⏳</span> <span>+3 Years Older</span>
              </div>
            </div>
          </div>

          <!-- Section C: Drop-to-Reset Vortex -->
          <div 
            class="action-zone p-5 border-rose-500/40 bg-rose-950/20 hover:border-rose-400" 
            data-zone-action="reset"
          >
            <div class="w-10 h-10 rounded-full bg-rose-900/60 text-rose-300 flex items-center justify-center text-lg mb-2 zone-ring">
              🗑️
            </div>
            <strong class="text-xs font-bold text-rose-300 uppercase tracking-wider">Reset Vortex</strong>
            <p class="text-[11px] text-[var(--text-muted)] mt-1">Drop any item here to clear stage</p>
          </div>

        </div>

        <!-- RIGHT COLUMN: Action Zones & Dynamic Canvas Workspace -->
        <div class="flex flex-col gap-6">

          <!-- PRIMARY ACTION ZONE 1: The Diagnostic Chamber -->
          <div 
            class="action-zone min-h-[190px] border-2 border-dashed ${state.activeItem ? 'border-emerald-500 bg-emerald-950/20' : 'border-emerald-500/50 bg-emerald-950/10'} transition-all" 
            id="zoneDiagnostic"
            data-zone-action="analyze"
          >
            ${state.activeItem ? `
              <!-- Active Loaded Item in Chamber -->
              <div class="w-full text-left animate-success-pop">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--border-subtle)]">
                  <div class="flex items-center gap-3">
                    <span class="text-3xl">${state.activeItem.icon || '📦'}</span>
                    <div>
                      <span class="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Item Locked in Chamber
                      </span>
                      <h2 class="text-xl font-black text-white mt-1">${escapeHtml(state.activeItem.name)}</h2>
                    </div>
                  </div>
                  <div class="text-xs font-mono text-emerald-400">
                    Age: ${state.activeItem.age} yrs · ${state.activeItem.condition} · ${state.activeItem.severity}
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                  <div class="p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                    <span class="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Top Evaluated Match</span>
                    <strong class="text-emerald-400 text-sm">${state.evaluation.topOption.name} (${state.evaluation.topOption.score}%)</strong>
                  </div>
                  <div class="p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                    <span class="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Potential Savings</span>
                    <strong class="text-white text-sm">~$${state.evaluation.savings} saved</strong>
                  </div>
                  <div class="p-3 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                    <span class="text-[10px] text-[var(--text-muted)] block uppercase font-bold">Eco Impact</span>
                    <strong class="text-teal-400 text-sm">-${state.evaluation.co2Saved} kg CO₂</strong>
                  </div>
                </div>

                <!-- Draggable Active Item Replica for Dropping into 5 Decision Portals -->
                <div class="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span class="text-xs text-[var(--text-muted)] font-medium">
                    👉 Now drag this <strong>Analysis Token</strong> into any Decision Portal below:
                  </span>
                  
                  <div 
                    class="draggable-card py-2 px-4 rounded-full bg-emerald-500 text-black font-extrabold text-xs shadow-lg inline-flex items-center gap-2 cursor-grab"
                    data-card-type="evaluated-item"
                  >
                    <span>${state.activeItem.icon || '📦'} Drag into a Decision Portal ➔</span>
                  </div>
                </div>
              </div>
            ` : `
              <!-- Empty Drop Prompt -->
              <div class="zone-ring bg-emerald-900/50 text-emerald-400 border border-emerald-500/40 animate-glow">
                🔬
              </div>
              <strong class="text-base font-black text-white tracking-wide">
                Drop Any Item Card Here to Analyze
              </strong>
              <p class="text-xs text-[var(--text-muted)] mt-1.5 max-w-md">
                Dragging a card into this chamber activates the 5-option rule engine and calculates carbon and dollar savings.
              </p>
            `}
          </div>

          <!-- PRIMARY ACTION ZONE 2: The 5 Decision Portals -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
                <span>🎯 The 5 Decision Portals (Action Zones)</span>
              </h3>
              <span class="text-[10px] text-[var(--text-muted)] font-bold">Drop evaluated token into desired path</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              
              <!-- Portal 1: Repair Bay -->
              <div 
                class="action-zone zone-portal-repair" 
                data-zone-action="select-plan" 
                data-plan-key="repair"
              >
                <div class="zone-ring bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  🔧
                </div>
                <strong class="text-xs font-black text-emerald-400 uppercase tracking-wide">1. Repair Bay</strong>
                <span class="text-xs font-extrabold text-white mt-0.5">
                  ${state.evaluation ? `${state.evaluation.options.repair.score}% Fit` : 'Ready'}
                </span>
                <p class="text-[10px] text-[var(--text-muted)] mt-1">Drop to load DIY Guide</p>
              </div>

              <!-- Portal 2: Reuse Depot -->
              <div 
                class="action-zone zone-portal-reuse" 
                data-zone-action="select-plan" 
                data-plan-key="reuse"
              >
                <div class="zone-ring bg-sky-950 text-sky-400 border border-sky-500/40">
                  🔄
                </div>
                <strong class="text-xs font-black text-sky-400 uppercase tracking-wide">2. Reuse Depot</strong>
                <span class="text-xs font-extrabold text-white mt-0.5">
                  ${state.evaluation ? `${state.evaluation.options.reuse.score}% Fit` : 'Ready'}
                </span>
                <p class="text-[10px] text-[var(--text-muted)] mt-1">Drop to Pass-Along</p>
              </div>

              <!-- Portal 3: Upcycle Studio -->
              <div 
                class="action-zone zone-portal-repurpose" 
                data-zone-action="select-plan" 
                data-plan-key="repurpose"
              >
                <div class="zone-ring bg-purple-950 text-purple-400 border border-purple-500/40">
                  ✨
                </div>
                <strong class="text-xs font-black text-purple-400 uppercase tracking-wide">3. Upcycle Studio</strong>
                <span class="text-xs font-extrabold text-white mt-0.5">
                  ${state.evaluation ? `${state.evaluation.options.repurpose.score}% Fit` : 'Ready'}
                </span>
                <p class="text-[10px] text-[var(--text-muted)] mt-1">Drop to Craft</p>
              </div>

              <!-- Portal 4: Replace Station -->
              <div 
                class="action-zone zone-portal-replace" 
                data-zone-action="select-plan" 
                data-plan-key="replace"
              >
                <div class="zone-ring bg-amber-950 text-amber-400 border border-amber-500/40">
                  🛍️
                </div>
                <strong class="text-xs font-black text-amber-400 uppercase tracking-wide">4. Replace Station</strong>
                <span class="text-xs font-extrabold text-white mt-0.5">
                  ${state.evaluation ? `${state.evaluation.options.replace.score}% Fit` : 'Ready'}
                </span>
                <p class="text-[10px] text-[var(--text-muted)] mt-1">Drop for Eco Criteria</p>
              </div>

              <!-- Portal 5: Recycle Vault -->
              <div 
                class="action-zone zone-portal-recycle" 
                data-zone-action="select-plan" 
                data-plan-key="recycle"
              >
                <div class="zone-ring bg-slate-900 text-slate-300 border border-slate-600/40">
                  ♻️
                </div>
                <strong class="text-xs font-black text-slate-300 uppercase tracking-wide">5. Recycle Vault</strong>
                <span class="text-xs font-extrabold text-white mt-0.5">
                  ${state.evaluation ? `${state.evaluation.options.recycle.score}% Fit` : 'Ready'}
                </span>
                <p class="text-[10px] text-[var(--text-muted)] mt-1">Drop for E-Waste Plan</p>
              </div>

            </div>
          </div>

          <!-- PRIMARY ACTION ZONE 3: Utility Drop Zones (Favorites & Compare) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div 
              class="action-zone border-amber-500/40 bg-amber-950/20 hover:border-amber-400" 
              data-zone-action="favorite"
            >
              <div class="w-10 h-10 rounded-full bg-amber-900/60 text-amber-300 flex items-center justify-center text-lg mb-1.5 zone-ring">
                ⭐
              </div>
              <strong class="text-xs font-bold text-amber-300 uppercase tracking-wider">Favorites Stash Zone</strong>
              <p class="text-[10px] text-[var(--text-muted)] mt-0.5">Drop item here to bookmark in LocalStorage (${state.favorites.length} saved)</p>
            </div>

            <div 
              class="action-zone border-sky-500/40 bg-sky-950/20 hover:border-sky-400" 
              data-zone-action="compare"
            >
              <div class="w-10 h-10 rounded-full bg-sky-900/60 text-sky-300 flex items-center justify-center text-lg mb-1.5 zone-ring">
                ⚖️
              </div>
              <strong class="text-xs font-bold text-sky-300 uppercase tracking-wider">Comparison Matrix Arena</strong>
              <p class="text-[10px] text-[var(--text-muted)] mt-0.5">Drop item here to toggle side-by-side 5-option matrix</p>
            </div>
          </div>

          <!-- DYNAMIC ACTION PLAN DISPLAY (Triggered by dropping into a Portal) -->
          ${state.activeActionPlan ? `
            <div class="glass-panel p-6 md:p-8 rounded-3xl border-2 border-emerald-500/50 shadow-2xl animate-success-pop" id="actionPlanContainer">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--border-subtle)]">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-white flex items-center justify-center text-2xl font-black">
                    ${state.activeActionPlan.icon}
                  </div>
                  <div>
                    <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active Action Plan Loaded
                    </span>
                    <h3 class="text-xl md:text-2xl font-black text-white mt-1">
                      ${state.activeActionPlan.name} Plan (${state.activeActionPlan.score}% Match)
                    </h3>
                  </div>
                </div>
                <div class="text-xs font-semibold text-[var(--text-muted)]">
                  ${state.activeActionPlan.time} • ${state.activeActionPlan.difficulty} • ${state.activeActionPlan.cost}
                </div>
              </div>

              <p class="text-sm text-[var(--text-muted)] mb-5 leading-relaxed">
                ${state.activeActionPlan.why}
              </p>

              <!-- Step Checklist -->
              <h4 class="text-xs font-black uppercase tracking-wider text-emerald-400 mb-3">
                Actionable Execution Checklist
              </h4>
              <div class="space-y-2 mb-6">
                ${state.activeActionPlan.checklist.map((step, idx) => `
                  <label class="flex items-start gap-3 p-3.5 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] cursor-pointer hover:border-emerald-500 transition">
                    <input type="checkbox" class="mt-0.5 w-4 h-4 rounded text-emerald-500 accent-emerald-500" />
                    <span class="text-xs text-white leading-relaxed font-medium">${idx + 1}. ${step}</span>
                  </label>
                `).join('')}
              </div>

              <!-- Print / Share Callout -->
              <div class="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-700/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span class="text-emerald-300">🌿 Plan generated successfully for ${escapeHtml(state.activeItem.name)}.</span>
                <span class="text-[11px] text-[var(--text-muted)] font-mono">Drag to Favorites Stash to keep.</span>
              </div>
            </div>
          ` : ''}

          <!-- COMPARISON MATRIX ARENA (Triggered by dropping into Compare Zone) -->
          ${state.showComparison && state.evaluation ? `
            <div class="glass-panel p-6 rounded-3xl border border-sky-500/50 shadow-xl animate-success-pop">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>⚖️ Side-by-Side 5-Option Comparison Matrix</span>
                </h3>
                <span class="text-xs text-sky-400 font-bold">${escapeHtml(state.activeItem.name)}</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr class="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                      <th class="py-2.5 px-3">Option</th>
                      <th class="py-2.5 px-3">Fit Score</th>
                      <th class="py-2.5 px-3">Estimated Cost</th>
                      <th class="py-2.5 px-3">Time</th>
                      <th class="py-2.5 px-3">Difficulty</th>
                      <th class="py-2.5 px-3">Eco Impact</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[var(--border-subtle)]">
                    ${state.evaluation.ranked.map(opt => `
                      <tr class="${state.activeActionPlan && state.activeActionPlan.key === opt.key ? 'bg-emerald-950/40 font-bold' : ''}">
                        <td class="py-3 px-3">
                          <span class="px-2.5 py-1 rounded-full text-[11px] font-bold" style="background: ${opt.color}22; color: ${opt.color}; border: 1px solid ${opt.color}44;">
                            ${opt.icon} #${opt.rank} ${opt.name}
                          </span>
                        </td>
                        <td class="py-3 px-3 font-extrabold text-sm text-emerald-400">${opt.score}%</td>
                        <td class="py-3 px-3 text-white">${opt.cost}</td>
                        <td class="py-3 px-3 text-[var(--text-muted)]">${opt.time}</td>
                        <td class="py-3 px-3">${opt.difficulty}</td>
                        <td class="py-3 px-3 text-[var(--text-muted)]">${opt.eco}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

        </div>

      </div>
    `;

    // Initialize unified Pointer Drag & Drop Engine
    initPointerDragDrop();
  }

  // --- UNIFIED POINTER DRAG & DROP ENGINE (Touch + Mouse) ---
  function initPointerDragDrop() {
    let currentDraggable = null;
    let dragGhost = null;
    let startX = 0, startY = 0;
    let offsetX = 0, offsetY = 0;
    let hoveredZone = null;

    const draggables = document.querySelectorAll('.draggable-card, .drag-modifier-chip');

    draggables.forEach(el => {
      el.addEventListener('pointerdown', (e) => {
        // Prevent default text selection
        e.preventDefault();

        currentDraggable = el;
        const rect = el.getBoundingClientRect();
        startX = rect.left;
        startY = rect.top;
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        // Create visual clone / ghost
        dragGhost = el.cloneNode(true);
        dragGhost.classList.add('is-dragging');
        dragGhost.style.position = 'fixed';
        dragGhost.style.left = `${rect.left}px`;
        dragGhost.style.top = `${rect.top}px`;
        dragGhost.style.width = `${rect.width}px`;
        dragGhost.style.pointerEvents = 'none';
        dragGhost.style.zIndex = '9999';
        document.body.appendChild(dragGhost);

        el.style.opacity = '0.35';

        // Set pointer capture
        try {
          el.setPointerCapture(e.pointerId);
        } catch (_) {}

        // Pointer move handler
        const onPointerMove = (moveEvent) => {
          if (!dragGhost) return;
          const currentX = moveEvent.clientX - offsetX;
          const currentY = moveEvent.clientY - offsetY;
          dragGhost.style.left = `${currentX}px`;
          dragGhost.style.top = `${currentY}px`;

          // Detect action zone underneath pointer
          const elemBelow = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
          const zone = elemBelow ? elemBelow.closest('.action-zone') : null;

          if (hoveredZone && hoveredZone !== zone) {
            hoveredZone.classList.remove('drag-active');
            hoveredZone = null;
          }

          if (zone && zone !== hoveredZone) {
            hoveredZone = zone;
            hoveredZone.classList.add('drag-active');
            if (navigator.vibrate) navigator.vibrate(10);
          }
        };

        // Pointer up handler
        const onPointerUp = (upEvent) => {
          document.removeEventListener('pointermove', onPointerMove);
          document.removeEventListener('pointerup', onPointerUp);

          if (currentDraggable) {
            currentDraggable.style.opacity = '1';
          }

          if (dragGhost) {
            dragGhost.remove();
            dragGhost = null;
          }

          if (hoveredZone) {
            hoveredZone.classList.remove('drag-active');
            handleDropAction(currentDraggable, hoveredZone);
            hoveredZone = null;
          }

          currentDraggable = null;
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
      });
    });
  }

  // --- DROP ACTION DISPATCHER ---
  function handleDropAction(draggedEl, targetZone) {
    if (!draggedEl || !targetZone) return;

    const cardType = draggedEl.getAttribute('data-card-type');
    const zoneAction = targetZone.getAttribute('data-zone-action');

    // 1. Drop into Diagnostic Chamber (Analyze Item)
    if (zoneAction === 'analyze') {
      if (cardType === 'item') {
        const itemId = draggedEl.getAttribute('data-item-id');
        let selectedItem = null;

        if (itemId === 'custom-item') {
          selectedItem = Object.assign({}, state.stagedCustomItem);
        } else {
          selectedItem = PRESET_CARDS.find(c => c.id === itemId);
        }

        if (selectedItem) {
          state.activeItem = selectedItem;
          state.evaluation = evaluateItem(selectedItem);
          state.activeActionPlan = null;
          showToast(`⚡ Locked into Chamber: ${selectedItem.name}`);
          renderCanvas();
        }
      } else if (cardType === 'modifier') {
        // Drop modifier token onto active item
        if (!state.activeItem) {
          showToast('⚠️ Drop an item into the Chamber first!');
          return;
        }
        applyModifierToken(draggedEl);
      }
    }

    // 2. Drop into Decision Portals (Activate specific plan)
    else if (zoneAction === 'select-plan') {
      if (!state.evaluation) {
        showToast('⚠️ Drop an item into the Diagnostic Chamber first!');
        return;
      }
      const planKey = targetZone.getAttribute('data-plan-key');
      state.activeActionPlan = state.evaluation.options[planKey];
      showToast(`🎯 Activated Plan: ${state.activeActionPlan.name}`);
      renderCanvas();
      
      // Smooth scroll to action plan
      setTimeout(() => {
        const planEl = document.getElementById('actionPlanContainer');
        if (planEl) planEl.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }

    // 3. Drop into Favorites Stash
    else if (zoneAction === 'favorite') {
      if (!state.activeItem) {
        showToast('⚠️ No active item to favorite!');
        return;
      }
      toggleFavorite(state.activeItem);
      renderCanvas();
    }

    // 4. Drop into Comparison Arena
    else if (zoneAction === 'compare') {
      if (!state.evaluation) {
        showToast('⚠️ Drop an item to analyze before comparing!');
        return;
      }
      state.showComparison = !state.showComparison;
      showToast(state.showComparison ? '⚖️ Comparison Matrix Opened!' : 'Comparison Matrix Closed');
      renderCanvas();
    }

    // 5. Drop into Reset Vortex
    else if (zoneAction === 'reset') {
      state.activeItem = null;
      state.evaluation = null;
      state.activeActionPlan = null;
      state.showComparison = false;
      showToast('🗑️ Canvas cleared! Draw a new item from deck.');
      renderCanvas();
    }
  }

  // --- APPLY MODIFIER TOKENS ---
  function applyModifierToken(tokenEl) {
    const modType = tokenEl.getAttribute('data-mod-type');
    const modVal = tokenEl.getAttribute('data-mod-val');

    if (modType === 'severity') {
      state.activeItem.severity = modVal;
      showToast(`🧪 Severity modified to: ${modVal.toUpperCase()}`);
    } else if (modType === 'condition') {
      state.activeItem.condition = modVal;
      showToast(`🧪 Condition modified to: ${modVal.toUpperCase()}`);
    } else if (modType === 'sentimental') {
      state.activeItem.sentimental = true;
      showToast('💎 Attached Sentimental Value!');
    } else if (modType === 'age') {
      state.activeItem.age += 3;
      showToast(`⏳ Age updated to ${state.activeItem.age} years old`);
    }

    state.evaluation = evaluateItem(state.activeItem);
    if (state.activeActionPlan) {
      state.activeActionPlan = state.evaluation.options[state.activeActionPlan.key];
    }
    renderCanvas();
  }

  // --- FAVORITES & TOAST HELPERS ---
  function toggleFavorite(item) {
    const existingIndex = state.favorites.findIndex(f => f.name === item.name);
    if (existingIndex >= 0) {
      state.favorites.splice(existingIndex, 1);
      showToast('Removed from favorites');
    } else {
      state.favorites.push({
        name: item.name,
        category: item.category,
        topOption: state.evaluation ? state.evaluation.topOption.name : 'Analyzed',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      showToast('⭐ Saved to Favorites Vault!');
    }
    localStorage.setItem('fif_favorites', JSON.stringify(state.favorites));
  }

  function showToast(msg) {
    const existing = document.getElementById('fifToast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'fifToast';
    toast.className = 'fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-emerald-950 text-white text-xs font-bold shadow-2xl border border-emerald-600 animate-fade-in flex items-center gap-2';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function applyTheme() {
    const root = document.documentElement;
    if (state.theme === 'dark' || (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
    if (state.contrast === 'high') {
      root.setAttribute('data-contrast', 'high');
    } else {
      root.removeAttribute('data-contrast');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return m;
      }
    });
  }

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    // Theme & Contrast toggles (display controls)
    const themeBtn = document.getElementById('btnThemeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('fif_theme', state.theme);
        applyTheme();
        themeBtn.textContent = state.theme === 'dark' ? '☀️' : '🌙';
      });
      themeBtn.textContent = state.theme === 'dark' ? '☀️' : '🌙';
    }

    const contrastBtn = document.getElementById('btnContrastToggle');
    if (contrastBtn) {
      contrastBtn.addEventListener('click', () => {
        state.contrast = state.contrast === 'high' ? 'normal' : 'high';
        localStorage.setItem('fif_contrast', state.contrast);
        applyTheme();
        showToast(state.contrast === 'high' ? 'High Contrast Mode' : 'Normal Contrast');
      });
    }

    renderCanvas();
  });

})();

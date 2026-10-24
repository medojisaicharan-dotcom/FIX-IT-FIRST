/**
 * Fix It First — Enhanced UI/UX & Rule-Based Scoring Engine
 * "Think before you throw."
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    currentStep: 1,
    theme: localStorage.getItem('fif_theme') || 'system',
    contrast: localStorage.getItem('fif_contrast') || 'normal',
    item: {
      name: '',
      category: 'furniture',
      age: 3,
      condition: 'good',
      brand: '',
      sentimental: false,
      description: '',
      severity: 'moderate',
      issues: [],
      replaceCost: 180
    },
    results: null,
    selectedOptionKey: 'repair',
    sessionHistory: [],
    favorites: JSON.parse(localStorage.getItem('fif_favorites') || '[]'),
    comparisonMode: false
  };

  // --- CATEGORY METADATA ---
  const CATEGORY_DATA = {
    furniture: {
      label: 'Furniture',
      icon: '🪑',
      defaultCost: 180,
      issues: ['Wobbly / Loose Joints', 'Broken Leg / Slat', 'Torn / Stained Fabric', 'Peeling Finish / Scratched Wood', 'Faulty Drawer Slide / Hinge', 'Squeaking / Grinding'],
      safetyChecks: (item) => {
        const flags = [];
        if (item.issues.some(i => i.toLowerCase().includes('leg') || i.toLowerCase().includes('joint')) && item.severity === 'severe') {
          flags.push({ type: 'structural', title: 'Structural Collapse Risk', desc: 'Avoid bearing heavy weight until load-bearing joints or braces are re-secured.', severity: 'warning' });
        }
        return flags;
      },
      tips: 'Tightening loose bolts or applying wood glue with a clamp resolves over 75% of wobbly furniture issues.'
    },
    appliance: {
      label: 'Appliances',
      icon: '🔌',
      defaultCost: 220,
      issues: ['Won\'t Power On', 'Unusual Noise / Vibration', 'Leaking Water', 'Overheating / Smelling', 'Door Won\'t Latch', 'Poor Performance / Clogged'],
      safetyChecks: (item) => {
        const flags = [];
        flags.push({ type: 'electrical', title: 'Electrical Hazard', desc: 'Always unplug from wall socket before inspecting or opening any panels.', severity: 'danger' });
        if (item.issues.some(i => i.toLowerCase().includes('overheating') || i.toLowerCase().includes('smell'))) {
          flags.push({ type: 'fire', title: 'Thermal Risk', desc: 'Discontinue use immediately if burning odor or scorched plugs are present.', severity: 'danger' });
        }
        return flags;
      },
      tips: 'Over 60% of appliance breakdowns are caused by simple blockages, dirty lint filters, or blown thermal fuses costing under $10.'
    },
    electronics: {
      label: 'Electronics',
      icon: '📱',
      defaultCost: 350,
      issues: ['Broken Screen / Glass', 'Battery Won\'t Hold Charge', 'Port Loose / Damaged', 'Slow / Software Bug', 'Buttons Jammed / Stuck', 'Water Exposure'],
      safetyChecks: (item) => {
        const flags = [];
        if (item.issues.some(i => i.toLowerCase().includes('battery'))) {
          flags.push({ type: 'battery', title: 'Lithium Battery Caution', desc: 'Do not puncture, bend, or force swollen battery cells.', severity: 'danger' });
        }
        flags.push({ type: 'electrical', title: 'Electrostatic Sensitivity', desc: 'Disconnect power & discharge static before opening delicate logic boards.', severity: 'warning' });
        return flags;
      },
      tips: 'Batteries and charging ports are often modular and inexpensive to replace using simple precision tools.'
    },
    clothing: {
      label: 'Clothing',
      icon: '👕',
      defaultCost: 65,
      issues: ['Ripped Seam / Hole', 'Broken Zipper / Slider', 'Missing Button / Snap', 'Faded / Discolored', 'Stretched Elastic', 'Pilling / Fraying'],
      safetyChecks: (item) => [],
      tips: 'A simple needle and thread kit ($4) or iron-on adhesive patch can easily double the lifespan of everyday garments.'
    },
    tools: {
      label: 'Tools & Hardware',
      icon: '🔧',
      defaultCost: 110,
      issues: ['Dull Blade / Edge', 'Rusted Metal', 'Cracked Wooden Handle', 'Frayed Electrical Cord', 'Motor Brushes Worn', 'Jammed Mechanism'],
      safetyChecks: (item) => {
        const flags = [];
        flags.push({ type: 'sharp', title: 'Sharp Edge Safety', desc: 'Wear heavy-duty leather work gloves and eye protection when sharpening or repairing.', severity: 'warning' });
        if (item.issues.some(i => i.toLowerCase().includes('cord'))) {
          flags.push({ type: 'electrical', title: 'Damaged Cord Risk', desc: 'Do not patch frayed high-draw power cords with tape; replace the cord assembly.', severity: 'danger' });
        }
        return flags;
      },
      tips: 'A white vinegar soak removes rust overnight, and a $6 sharpening stone restores dull blades to razor sharpness.'
    },
    other: {
      label: 'Other Items',
      icon: '📦',
      defaultCost: 80,
      issues: ['Cracked Plastic', 'Broken Hinge / Clip', 'Worn Out Gasket', 'Surface Scratched', 'Missing Minor Screw / Part', 'Unwanted But Functional'],
      safetyChecks: (item) => [],
      tips: 'Two-part epoxy, baking soda + superglue, or Sugru moldable silicone bond nearly all household plastics.'
    }
  };

  // --- SCORING ENGINE ---
  function evaluateItem(item) {
    const age = Math.max(0.1, Number(item.age) || 1);
    const cond = item.condition;
    const sev = item.severity;
    const isSentimental = Boolean(item.sentimental);
    const cat = item.category;
    const catInfo = CATEGORY_DATA[cat] || CATEGORY_DATA.other;
    const replaceCost = Math.max(10, Number(item.replaceCost) || catInfo.defaultCost);

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

    // Category
    if (cat === 'clothing') { sRepair += 15; sRepurpose += 25; sReplace -= 15; }
    else if (cat === 'furniture') { sRepair += 15; sRepurpose += 20; sReplace -= 20; }
    else if (cat === 'electronics') {
      if (age > 7) { sRepair -= 15; sReplace += 20; sRecycle += 25; }
      else { sRepair += 10; }
    } else if (cat === 'tools') { sRepair += 20; sReuse += 15; sReplace -= 20; }

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

    let repairCostMin = Math.round(replaceCost * (sev === 'minor' ? 0.05 : sev === 'moderate' ? 0.15 : 0.35));
    let repairCostMax = Math.round(replaceCost * (sev === 'minor' ? 0.15 : sev === 'moderate' ? 0.30 : 0.60));
    repairCostMin = Math.max(5, repairCostMin);
    repairCostMax = Math.max(repairCostMin + 10, repairCostMax);
    const avgSavings = Math.max(10, Math.round(replaceCost - (repairCostMin + repairCostMax) / 2));

    const catCarbon = { furniture: 45, appliance: 85, electronics: 60, clothing: 18, tools: 25, other: 20 };
    const baseCo2 = catCarbon[cat] || 25;
    const co2Saved = Math.round(baseCo2 * (sev === 'minor' ? 1.0 : 0.85));
    const wasteDiverted = Math.round((cat === 'furniture' ? 22 : cat === 'appliance' ? 35 : cat === 'clothing' ? 1.5 : 8) * 10) / 10;

    const safetyFlags = catInfo.safetyChecks(item);
    const diySteps = generateDiySteps(item, cat, sev);

    const options = {
      repair: {
        key: 'repair',
        name: 'Repair',
        score: sRepair,
        fillColor: '#10b981',
        badgeClass: 'badge-repair',
        icon: '🔧',
        why: getWhySentence('repair', item, sRepair, avgSavings),
        pros: [
          `Save an estimated $${avgSavings} compared to buying new`,
          'Preserves original item quality and keeps it in service',
          `Prevents ~${wasteDiverted} kg of household waste from entering landfills`
        ],
        cons: [
          'Requires hands-on time and basic tools',
          sev === 'severe' ? 'May need replacement parts that take time to ship' : 'Requires following step-by-step instructions'
        ],
        time: sev === 'minor' ? '20–45 mins' : sev === 'moderate' ? '1–2 hours' : '2–4 hours',
        difficulty: sev === 'minor' ? 'Easy' : sev === 'moderate' ? 'Medium' : 'Challenging',
        costEstimate: `$${repairCostMin} – $${repairCostMax}`,
        ecoImpact: `Avoids ~${co2Saved} kg CO₂ emissions`,
        checklist: [
          'Unplug or isolate the item completely if applicable',
          'Gather basic tools (screwdriver, pliers, adhesive, or cleaning cloth)',
          'Diagnose the exact point of failure (loose joint, blown fuse, stripped thread)',
          'Source replacement screw/part locally or from existing spare hardware',
          'Perform repair following the step-by-step instructions',
          'Test safely under normal operating conditions'
        ]
      },
      reuse: {
        key: 'reuse',
        name: 'Reuse / Pass Along',
        score: sReuse,
        fillColor: '#0284c7',
        badgeClass: 'badge-reuse',
        icon: '🔄',
        why: getWhySentence('reuse', item, sReuse),
        pros: [
          'Zero or near-zero repair cost required',
          'Gives an unwanted or mildly worn item an immediate second life',
          'Great for local community gifting (Freecycle, Buy Nothing groups)'
        ],
        cons: [
          'Requires finding someone who needs it if you no longer want it',
          'May need light cleaning or minor tune-up before handoff'
        ],
        time: '15–30 mins',
        difficulty: 'Very Easy',
        costEstimate: '$0 – $10 (cleaning)',
        ecoImpact: '100% material life extension',
        checklist: [
          'Wipe down and clean the item thoroughly',
          'Check if a neighbor, family member, or friend can use it',
          'Post on local "Buy Nothing" or community gifting apps',
          'Donate to a local charity or thrift cooperative'
        ]
      },
      repurpose: {
        key: 'repurpose',
        name: 'Repurpose / Upcycle',
        score: sRepurpose,
        fillColor: '#9333ea',
        badgeClass: 'badge-repurpose',
        icon: '✨',
        why: getWhySentence('repurpose', item, sRepurpose),
        pros: [
          'Transforms broken function into a creative new functional piece',
          'Preserves sentimental or unique materials (wood, metal, fabric)',
          'Custom one-of-a-kind result with high personal satisfaction'
        ],
        cons: [
          'Requires creativity and craft/hand tools',
          'Item will no longer perform its original intended role'
        ],
        time: '1–3 hours',
        difficulty: 'Medium',
        costEstimate: '$5 – $25 (craft supplies)',
        ecoImpact: `Keeps ~${wasteDiverted} kg out of the waste stream`,
        checklist: [
          'Disassemble damaged components that cannot be safely reused',
          'Sand, wash, or treat salvageable materials',
          'Identify new purpose (e.g. storage bin, planter, art frame, workshop organizer)',
          'Assemble using brackets, glue, or fasteners'
        ]
      },
      replace: {
        key: 'replace',
        name: 'Replace (Sustainable Choice)',
        score: sReplace,
        fillColor: '#ea580c',
        badgeClass: 'badge-replace',
        icon: '🛍️',
        why: getWhySentence('replace', item, sReplace, replaceCost),
        pros: [
          'Instant return to 100% reliable functionality',
          'New items may offer superior energy efficiency or safety standards',
          'Backed by warranty coverage'
        ],
        cons: [
          `Highest financial cost (estimated ~$${replaceCost})`,
          `Generates fresh carbon footprint from manufacturing and transport`,
          'Requires responsible disposal of the outgoing item'
        ],
        time: '1–2 days (delivery/shopping)',
        difficulty: 'Easy',
        costEstimate: `~$${replaceCost}`,
        ecoImpact: 'Consumes new manufacturing resources',
        checklist: [
          'Look for refurbished, open-box, or certified pre-owned units first',
          'Choose brands known for high repairability & spare part availability',
          'Check warranty length and user-replaceable battery/part policies',
          'Ensure the old unit is handed off to responsible recycling, not trash'
        ]
      },
      recycle: {
        key: 'recycle',
        name: 'Recycle / Discard',
        score: sRecycle,
        fillColor: '#64748b',
        badgeClass: 'badge-recycle',
        icon: '♻️',
        why: getWhySentence('recycle', item, sRecycle),
        pros: [
          'Reclaims raw metals, glass, circuit elements, or fibers',
          'Keeps toxic materials (lead, mercury, cadmium, batteries) out of landfills',
          'Clears cluttered home space safely'
        ],
        cons: [
          'Item is taken out of circulation permanently',
          'May require drop-off at a dedicated municipal facility'
        ],
        time: '30–60 mins (drop off)',
        difficulty: 'Easy',
        costEstimate: '$0 (usually free municipal drop-off)',
        ecoImpact: 'Recovers circular raw materials',
        checklist: [
          'Separate hazardous parts (batteries, light bulbs, gas canisters)',
          'Locate certified e-waste or municipal scrap collection depot',
          'Bundle cables or accessories together',
          'Drop off during official collection hours'
        ]
      }
    };

    const rankedList = Object.values(options).sort((a, b) => b.score - a.score);
    rankedList.forEach((opt, index) => { opt.rank = index + 1; });

    return {
      item,
      rankedList,
      optionsMap: options,
      topOption: rankedList[0],
      savings: avgSavings,
      co2Saved,
      wasteDiverted,
      replaceCost,
      safetyFlags,
      diySteps,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  function getWhySentence(optionKey, item, score, extra) {
    const name = item.name || 'this item';
    const cond = item.condition;
    const sev = item.severity;

    switch (optionKey) {
      case 'repair':
        if (sev === 'minor') return `With only minor wear and a solid structure, a quick fix saves money and keeps ${name} in action.`;
        if (cond === 'excellent' || cond === 'good') return `The main body is sturdy—fixing the specific faulty part yields high value for minimal cost.`;
        return `A budget-friendly repair avoids the cost of replacing the entire unit while keeping useful materials in play.`;
      case 'reuse':
        if (cond === 'excellent' || sev === 'minor') return `This item is still largely functional; passing it along gives it immediate utility with zero rework.`;
        return `Someone in your local community or a second home could put this item to good use as-is.`;
      case 'repurpose':
        return `The original function is compromised, but its raw structure and materials are ideal for an upcycled creative project.`;
      case 'replace':
        if (score > 60) return `Due to the severe damage and older age, replacing with a repairable, energy-efficient model may be more practical.`;
        return `Replacing is viable, but repair or reuse offers significantly better financial and environmental return here.`;
      case 'recycle':
        return `If repair or upcycling is out of reach, recycling recovers metals and raw components without polluting landfills.`;
      default:
        return `Evaluated for maximum practical and environmental value.`;
    }
  }

  function generateDiySteps(item, cat, sev) {
    if (cat === 'furniture') {
      return [
        { title: 'Inspect & Identify', desc: 'Wiggle joints to locate loose screws, sheared dowels, or cracked corner brackets.' },
        { title: 'Disassemble & Clean', desc: 'Remove loose fasteners. Clean out dust, old dried glue, and debris from sockets.' },
        { title: 'Re-glue & Clamp', desc: 'Apply wood glue to loose joints, tighten hardware, and clamp firmly for 30 minutes.' },
        { title: 'Reinforce & Test', desc: 'Add an inexpensive L-bracket or rubber washer underneath for long-term wobble prevention.' }
      ];
    } else if (cat === 'appliance' || cat === 'electronics') {
      return [
        { title: 'Safety Isolation', desc: 'Ensure power cords are unplugged and internal capacitors are safely discharged.' },
        { title: 'Access & Clean', desc: 'Open outer housing screws. Clear out dust, lint, and corrosion with isopropyl alcohol.' },
        { title: 'Inspect Connections', desc: 'Look for loose ribbon cables, severed wires, swollen capacitors, or blown thermal fuses.' },
        { title: 'Reassemble & Test', desc: 'Re-seat plugs, re-fasten screws evenly, and test on a surge-protected circuit.' }
      ];
    } else if (cat === 'clothing') {
      return [
        { title: 'Pin & Align', desc: 'Turn garment inside out and pin torn seams or holes neatly in place.' },
        { title: 'Backstitch or Patch', desc: 'Use matching thread with a strong backstitch, or apply iron-on fusible interfacing.' },
        { title: 'Reinforce Corners', desc: 'Double-stitch corners or zipper stops to prevent future tearing.' }
      ];
    } else {
      return [
        { title: 'Clean & Prep', desc: 'Wipe away grease, dirt, and loose fragments to expose clean bonding surfaces.' },
        { title: 'Select Right Adhesive', desc: 'Choose suitable bonding agent (epoxy, wood glue, or matching replacement screw).' },
        { title: 'Bond & Cure', desc: 'Apply evenly and clamp or tape securely until fully cured (usually 1–24 hours).' },
        { title: 'Verify Integrity', desc: 'Perform gentle load testing before returning to everyday usage.' }
      ];
    }
  }

  // --- RENDERING VIEWS ---

  function renderApp() {
    applyTheme();
    renderStepView();
    updateProgressIndicator();
  }

  function applyTheme() {
    const root = document.documentElement;
    if (state.theme === 'dark' || (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    if (state.contrast === 'high') {
      root.setAttribute('data-contrast', 'high');
    } else {
      root.removeAttribute('data-contrast');
    }
  }

  function updateProgressIndicator() {
    const progressEl = document.getElementById('flowProgress');
    const dots = [document.getElementById('dotStep2'), document.getElementById('dotStep3'), document.getElementById('dotStep4')];
    if (!progressEl) return;

    if (state.currentStep === 1) {
      progressEl.classList.add('hidden');
    } else {
      progressEl.classList.remove('hidden');
      dots.forEach((dot, idx) => {
        if (!dot) return;
        const stepNum = idx + 2;
        dot.classList.remove('active', 'completed');
        if (state.currentStep === stepNum) dot.classList.add('active');
        else if (state.currentStep > stepNum) dot.classList.add('completed');
      });
    }
  }

  function renderStepView() {
    const container = document.getElementById('mainContent');
    if (!container) return;
    if (state.currentStep === 1) renderWelcomeScreen(container);
    else if (state.currentStep === 2) renderAddItemScreen(container);
    else if (state.currentStep === 3) renderDescribeProblemScreen(container);
    else if (state.currentStep === 4) renderResultsScreen(container);
  }

  // SCREEN 1: WELCOME
  function renderWelcomeScreen(container) {
    container.innerHTML = `
      <section class="max-w-4xl mx-auto text-center py-8 md:py-14 animate-fade-in">
        
        <!-- Animated Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-sm mb-6">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Decision Helper for Broken & Unwanted Items</span>
        </div>

        <!-- Hero Headline -->
        <h1 class="text-4xl md:text-6xl font-black tracking-tight text-[var(--text-main)] mb-3">
          Fix It First.
        </h1>
        <p class="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">
          “Think before you throw.”
        </p>
        <p class="text-base md:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed mb-10">
          Replacing things is easy, but it shouldn't be the default. We evaluate <strong class="text-[var(--text-main)]">Repair, Reuse, Repurpose, Replace, and Recycle</strong> with transparent fit scores, dollar savings, and step-by-step action plans.
        </p>

        <!-- Main Action Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <button id="btnStart" class="btn-primary w-full sm:w-auto">
            <span>Start Free Assessment</span>
            <svg class="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
          
          <button id="btnDemoWobblyChair" class="btn-demo w-full sm:w-auto">
            <span>⚡ Try Demo: Wobbly Office Chair</span>
          </button>
        </div>

        <!-- 5 Paths Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-left mb-14">
          <div class="glass-panel p-4 rounded-xl border border-[var(--border-subtle)] hover:border-emerald-500 transition">
            <span class="text-xs font-bold px-2 py-0.5 rounded badge-repair inline-block mb-1.5">1. Repair</span>
            <p class="text-xs text-[var(--text-muted)]">Fix simple parts & save 70%+ vs buying new.</p>
          </div>
          <div class="glass-panel p-4 rounded-xl border border-[var(--border-subtle)] hover:border-sky-500 transition">
            <span class="text-xs font-bold px-2 py-0.5 rounded badge-reuse inline-block mb-1.5">2. Reuse</span>
            <p class="text-xs text-[var(--text-muted)]">Pass along to someone who needs it as-is.</p>
          </div>
          <div class="glass-panel p-4 rounded-xl border border-[var(--border-subtle)] hover:border-purple-500 transition">
            <span class="text-xs font-bold px-2 py-0.5 rounded badge-repurpose inline-block mb-1.5">3. Repurpose</span>
            <p class="text-xs text-[var(--text-muted)]">Transform damaged goods into creative assets.</p>
          </div>
          <div class="glass-panel p-4 rounded-xl border border-[var(--border-subtle)] hover:border-amber-500 transition">
            <span class="text-xs font-bold px-2 py-0.5 rounded badge-replace inline-block mb-1.5">4. Replace</span>
            <p class="text-xs text-[var(--text-muted)]">Guided to durable, repairable alternatives.</p>
          </div>
          <div class="glass-panel p-4 rounded-xl border border-[var(--border-subtle)] hover:border-slate-500 transition col-span-2 sm:col-span-1">
            <span class="text-xs font-bold px-2 py-0.5 rounded badge-recycle inline-block mb-1.5">5. Recycle</span>
            <p class="text-xs text-[var(--text-muted)]">Reclaim metals & keep hazardous e-waste out.</p>
          </div>
        </div>

        <!-- Inspiration Gallery -->
        <div class="text-left pt-8 border-t border-[var(--border-subtle)]">
          <h2 class="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
            <span>✨ Before & After Inspiration</span>
            <span class="text-xs font-normal text-[var(--text-muted)]">(Real fixes made by people at home)</span>
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="glass-panel p-4 rounded-2xl">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">Repair</span>
                <span class="text-xs font-semibold text-emerald-600">Saved $140</span>
              </div>
              <h3 class="font-bold text-sm text-[var(--text-main)] mb-1">Office Chair Gas Lift</h3>
              <p class="text-xs text-[var(--text-muted)] leading-relaxed">Chair sank continuously. A $14 cylinder swap made it feel brand new in 20 minutes.</p>
            </div>

            <div class="glass-panel p-4 rounded-2xl">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-sky-700 bg-sky-100 dark:bg-sky-950 dark:text-sky-300 px-2.5 py-0.5 rounded-full">Reuse</span>
                <span class="text-xs font-semibold text-sky-600">Gifted in 24h</span>
              </div>
              <h3 class="font-bold text-sm text-[var(--text-main)] mb-1">Extra Microwave</h3>
              <p class="text-xs text-[var(--text-muted)] leading-relaxed">Upgraded kitchen; gifted clean, working unit to a student via local Buy Nothing group.</p>
            </div>

            <div class="glass-panel p-4 rounded-2xl">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-purple-700 bg-purple-100 dark:bg-purple-950 dark:text-purple-300 px-2.5 py-0.5 rounded-full">Repurpose</span>
                <span class="text-xs font-semibold text-purple-600">Custom Decor</span>
              </div>
              <h3 class="font-bold text-sm text-[var(--text-main)] mb-1">Stepladder Bookshelf</h3>
              <p class="text-xs text-[var(--text-muted)] leading-relaxed">Wobbly vintage wooden ladder converted into a rustic vertical plant & book stand.</p>
            </div>
          </div>
        </div>
      </section>
    `;

    document.getElementById('btnStart').addEventListener('click', () => {
      state.currentStep = 2;
      renderApp();
    });

    document.getElementById('btnDemoWobblyChair').addEventListener('click', loadWobblyChairDemo);
  }

  function loadWobblyChairDemo() {
    state.item = {
      name: 'Ergonomic Desk Chair',
      category: 'furniture',
      age: 4,
      condition: 'good',
      brand: 'IKEA / Generic',
      sentimental: false,
      description: 'The seat wobbles heavily when shifting weight, and the height cylinder slowly sinks over an hour.',
      severity: 'moderate',
      issues: ['Wobbly / Loose Joints', 'Squeaking / Grinding'],
      replaceCost: 180
    };
    state.results = evaluateItem(state.item);
    state.currentStep = 4;
    addToSessionHistory(state.results);
    renderApp();
  }

  // SCREEN 2: ADD ITEM (With Visual Choice Tiles)
  function renderAddItemScreen(container) {
    container.innerHTML = `
      <section class="max-w-3xl mx-auto py-6 animate-fade-in">
        <div class="mb-6">
          <button id="btnBackHome" class="btn-secondary text-xs px-3 py-1.5 mb-3">
            ← Back to Home
          </button>
          <h2 class="text-2xl md:text-3xl font-extrabold text-[var(--text-main)]">Step 1: Tell Us About the Item</h2>
          <p class="text-sm text-[var(--text-muted)]">We evaluate item category, materials, and age to determine feasible options.</p>
        </div>

        <form id="itemForm" class="glass-panel p-6 md:p-8 rounded-3xl flex flex-col gap-6 shadow-md">
          
          <!-- Item Name -->
          <div>
            <label for="itemName" class="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-2">
              Item Name <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="itemName" 
              required 
              placeholder="e.g. Ergonomic Office Chair, Cordless Vacuum, Winter Jacket"
              value="${escapeHtml(state.item.name)}"
              class="w-full px-4 py-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-alt)] text-[var(--text-main)] text-sm font-medium focus:border-emerald-600 focus:outline-none transition"
            />
          </div>

          <!-- Category Tiles -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-2">
              Select Category
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5" id="categoryTileGroup">
              ${Object.entries(CATEGORY_DATA).map(([catKey, catData]) => `
                <div 
                  class="choice-tile ${state.item.category === catKey ? 'active' : ''}" 
                  data-cat="${catKey}"
                >
                  <span class="text-2xl mb-1">${catData.icon}</span>
                  <span class="text-xs font-bold text-[var(--text-main)]">${catData.label}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Age & Cost Sliders -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 rounded-2xl bg-[var(--bg-surface-alt)]">
            <div>
              <div class="flex items-center justify-between mb-2">
                <label for="itemAge" class="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  Age of Item
                </label>
                <span id="ageDisplay" class="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">${state.item.age} years old</span>
              </div>
              <input 
                type="range" 
                id="itemAge" 
                min="0.5" 
                max="15" 
                step="0.5" 
                value="${state.item.age}"
                class="w-full accent-emerald-600 cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-[var(--text-faint)] mt-1 font-medium">
                <span>Under 1 yr</span>
                <span>5 yrs</span>
                <span>10+ yrs</span>
              </div>
            </div>

            <div>
              <label for="replaceCost" class="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-2">
                Estimated Cost to Buy New ($)
              </label>
              <div class="relative">
                <span class="absolute left-3.5 top-2.5 text-sm text-[var(--text-muted)] font-bold">$</span>
                <input 
                  type="number" 
                  id="replaceCost" 
                  min="10" 
                  max="5000" 
                  value="${state.item.replaceCost}" 
                  class="w-full pl-8 pr-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] text-sm font-semibold focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Overall Condition Tiles -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-2">
              Overall Body & Structure Condition
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5" id="conditionTileGroup">
              ${[
                { id: 'excellent', label: 'Excellent', desc: 'Like new, solid', dot: 'bg-emerald-500' },
                { id: 'good', label: 'Good', desc: 'Minor wear & tear', dot: 'bg-teal-500' },
                { id: 'fair', label: 'Fair', desc: 'Noticeable flaws', dot: 'bg-amber-500' },
                { id: 'poor', label: 'Poor', desc: 'Heavily worn', dot: 'bg-rose-500' }
              ].map(c => `
                <div 
                  class="choice-tile ${state.item.condition === c.id ? 'active' : ''}" 
                  data-cond="${c.id}"
                >
                  <span class="w-2.5 h-2.5 rounded-full ${c.dot} mb-1.5"></span>
                  <span class="text-xs font-bold capitalize text-[var(--text-main)]">${c.label}</span>
                  <span class="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">${c.desc}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Sentimental Checkbox -->
          <div class="pt-1">
            <label class="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-alt)] hover:border-emerald-600 transition cursor-pointer">
              <input type="checkbox" id="sentimentalVal" ${state.item.sentimental ? 'checked' : ''} class="w-4 h-4 rounded text-emerald-600 accent-emerald-600" />
              <div>
                <span class="text-xs font-bold text-[var(--text-main)] block">Special Sentimental Value Attached</span>
                <span class="text-[11px] text-[var(--text-muted)] block">Gift from loved one, vintage piece, or favorite item</span>
              </div>
            </label>
          </div>

          <!-- Category Quick Tip Card -->
          <div id="categoryTip" class="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
            <span class="text-xl">💡</span>
            <div>
              <span class="font-bold block text-emerald-800 dark:text-emerald-300 mb-0.5">Category Tip</span>
              <p id="tipText" class="leading-relaxed">${CATEGORY_DATA[state.item.category]?.tips || ''}</p>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-between pt-2">
            <span class="text-xs text-[var(--text-faint)]">Next: Describe symptoms & severity</span>
            <button type="submit" class="btn-primary">
              <span>Continue to Problem</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </form>
      </section>
    `;

    document.getElementById('btnBackHome').addEventListener('click', () => {
      state.currentStep = 1;
      renderApp();
    });

    // Category Tile Selection
    document.querySelectorAll('#categoryTileGroup .choice-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        state.item.category = tile.getAttribute('data-cat');
        const catData = CATEGORY_DATA[state.item.category] || CATEGORY_DATA.other;
        state.item.replaceCost = catData.defaultCost;
        renderAddItemScreen(container);
      });
    });

    // Condition Tile Selection
    document.querySelectorAll('#conditionTileGroup .choice-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        state.item.condition = tile.getAttribute('data-cond');
        renderAddItemScreen(container);
      });
    });

    const ageInput = document.getElementById('itemAge');
    const ageDisplay = document.getElementById('ageDisplay');
    ageInput.addEventListener('input', (e) => {
      state.item.age = parseFloat(e.target.value);
      ageDisplay.textContent = `${state.item.age} years old`;
    });

    document.getElementById('itemForm').addEventListener('submit', (e) => {
      e.preventDefault();
      state.item.name = document.getElementById('itemName').value.trim();
      state.item.replaceCost = parseFloat(document.getElementById('replaceCost').value) || 100;
      state.item.sentimental = document.getElementById('sentimentalVal').checked;
      state.currentStep = 3;
      renderApp();
    });
  }

  // SCREEN 3: DESCRIBE PROBLEM
  function renderDescribeProblemScreen(container) {
    const catData = CATEGORY_DATA[state.item.category] || CATEGORY_DATA.other;

    container.innerHTML = `
      <section class="max-w-3xl mx-auto py-6 animate-fade-in">
        <div class="mb-6">
          <button id="btnBackStep2" class="btn-secondary text-xs px-3 py-1.5 mb-3">
            ← Back to Item Details
          </button>
          <h2 class="text-2xl md:text-3xl font-extrabold text-[var(--text-main)]">Step 2: What's Wrong with ${escapeHtml(state.item.name)}?</h2>
          <p class="text-sm text-[var(--text-muted)]">Select known symptoms and indicate severity to calculate the fit score.</p>
        </div>

        <form id="problemForm" class="glass-panel p-6 md:p-8 rounded-3xl flex flex-col gap-6 shadow-md">
          
          <!-- Quick Pick Chips -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-2.5">
              Common Symptoms for ${catData.label} (Tap to toggle)
            </label>
            <div class="flex flex-wrap gap-2">
              ${catData.issues.map(issue => `
                <button 
                  type="button" 
                  class="issue-chip ${state.item.issues.includes(issue) ? 'active' : ''}"
                  data-issue="${escapeHtml(issue)}"
                >
                  <span>${state.item.issues.includes(issue) ? '✓' : '+'}</span>
                  <span>${escapeHtml(issue)}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Free-text input -->
          <div>
            <label for="problemDescription" class="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-2">
              Describe in your own words (optional)
            </label>
            <textarea 
              id="problemDescription" 
              rows="3" 
              placeholder="e.g. Squeaks when leaned on, wobbles at base, or won't turn on..."
              class="w-full px-4 py-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-alt)] text-[var(--text-main)] text-sm focus:border-emerald-600 focus:outline-none transition"
            >${escapeHtml(state.item.description)}</textarea>
          </div>

          <!-- Severity Selector Cards -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-2.5">
              Issue Severity
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" id="severityGroup">
              ${[
                { id: 'minor', label: 'Minor', sub: 'Cosmetic or small annoyance; item still functions', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
                { id: 'moderate', label: 'Moderate', sub: 'Core function impaired, but structure intact', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
                { id: 'severe', label: 'Severe', sub: 'Non-functional, broken in half, or hazardous', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' }
              ].map(s => `
                <div 
                  class="choice-tile text-left items-start ${state.item.severity === s.id ? 'active' : ''}" 
                  data-sev="${s.id}"
                >
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge} mb-2 uppercase">${s.label}</span>
                  <p class="text-xs text-[var(--text-muted)] leading-relaxed">${s.sub}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Positive Micro-copy -->
          <div class="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-3">
            <span class="text-2xl">🌱</span>
            <p><strong>You’re already thinking smarter than most people!</strong> Taking 60 seconds to evaluate options saves households an average of $450/year in unnecessary replacements.</p>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-between pt-2">
            <button type="button" id="btnBackToItem" class="btn-secondary text-xs px-4 py-2">
              Back
            </button>
            <button type="submit" class="btn-primary">
              <span>Evaluate 5 Options Now</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </button>
          </div>
        </form>
      </section>
    `;

    document.getElementById('btnBackStep2').addEventListener('click', () => {
      state.currentStep = 2;
      renderApp();
    });
    document.getElementById('btnBackToItem').addEventListener('click', () => {
      state.currentStep = 2;
      renderApp();
    });

    document.querySelectorAll('.issue-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-issue');
        if (state.item.issues.includes(val)) {
          state.item.issues = state.item.issues.filter(i => i !== val);
        } else {
          state.item.issues.push(val);
        }
        renderDescribeProblemScreen(container);
      });
    });

    document.querySelectorAll('#severityGroup .choice-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        state.item.severity = tile.getAttribute('data-sev');
        renderDescribeProblemScreen(container);
      });
    });

    document.getElementById('problemForm').addEventListener('submit', (e) => {
      e.preventDefault();
      state.item.description = document.getElementById('problemDescription').value.trim();
      state.results = evaluateItem(state.item);
      state.selectedOptionKey = state.results.topOption.key;
      addToSessionHistory(state.results);
      state.currentStep = 4;
      renderApp();
    });
  }

  // SCREEN 4: RESULTS & ACTION PLAN
  function renderResultsScreen(container) {
    const res = state.results;
    if (!res) {
      state.currentStep = 1;
      renderApp();
      return;
    }

    const currentOpt = res.optionsMap[state.selectedOptionKey] || res.topOption;
    const isFavorite = state.favorites.some(f => f.name === res.item.name && f.timestamp === res.timestamp);

    container.innerHTML = `
      <section class="max-w-6xl mx-auto py-6 animate-fade-in printable-area">
        
        <!-- Top Recommendation Hero Card -->
        <div class="glass-panel p-6 md:p-8 rounded-3xl mb-8 border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/50 via-[var(--bg-surface)] to-[var(--bg-surface-alt)] shadow-lg">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div class="flex items-start gap-4">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-600/30 shrink-0">
                ${res.topOption.icon}
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-600 text-white shadow-sm">
                    #1 Recommended Match
                  </span>
                  <span class="text-xs text-[var(--text-muted)] font-medium">${escapeHtml(res.item.name)} (${capitalize(res.item.category)}, ${res.item.age} yrs)</span>
                </div>
                <h2 class="text-2xl md:text-4xl font-black text-[var(--text-main)] tracking-tight">
                  ${res.topOption.name} <span class="text-emerald-600 dark:text-emerald-400">(${res.topOption.score}%)</span>
                </h2>
                <p class="text-sm md:text-base text-[var(--text-muted)] mt-2 max-w-2xl leading-relaxed">
                  ${res.topOption.why}
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center flex-wrap gap-2 shrink-0 no-print">
              <button id="btnToggleFavorite" class="btn-secondary text-xs px-3.5 py-2">
                <span>${isFavorite ? '★ Saved to Favorites' : '☆ Add Favorite'}</span>
              </button>

              <button id="btnToggleComparison" class="btn-secondary text-xs px-3.5 py-2">
                <span>${state.comparisonMode ? 'Hide Matrix' : '⚖️ Compare All 5'}</span>
              </button>

              <button id="btnShareSummary" class="btn-secondary text-xs px-3.5 py-2" title="Share Summary">
                <span>📋 Share</span>
              </button>

              <button id="btnPrintSummary" class="btn-secondary text-xs px-3.5 py-2" title="Print Report">
                <span>🖨️ Print</span>
              </button>

              <button id="btnNewAssessment" class="btn-primary text-xs px-4 py-2">
                <span>+ New Item</span>
              </button>
            </div>
          </div>

          <!-- Highlight Metric Badges -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-[var(--border-subtle)]">
            <div class="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-lg">💰</div>
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Potential Savings</span>
                <div class="text-lg font-black text-emerald-600 dark:text-emerald-400">~$${res.savings} Saved</div>
              </div>
            </div>

            <div class="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div class="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-lg">🌱</div>
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Eco Impact Score</span>
                <div class="text-lg font-black text-teal-600 dark:text-teal-400">-${res.co2Saved} kg CO₂</div>
              </div>
            </div>

            <div class="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-lg">⏱️</div>
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Time & Difficulty</span>
                <div class="text-sm font-bold text-[var(--text-main)]">${res.topOption.time} • <span class="text-amber-600">${res.topOption.difficulty}</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Safety Hazard Alert -->
        ${res.safetyFlags.length > 0 ? `
          <div class="mb-8 p-5 rounded-3xl bg-amber-50/95 dark:bg-amber-950/70 border-2 border-amber-400/60 text-amber-900 dark:text-amber-200 shadow-sm">
            <div class="flex items-center gap-2 font-black text-sm mb-2">
              <span class="text-xl">⚠️</span>
              <span>Safety Flag System Active</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${res.safetyFlags.map(flag => `
                <div class="text-xs bg-amber-100/70 dark:bg-amber-900/50 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span class="font-bold text-amber-800 dark:text-amber-300">• ${flag.title}:</span> ${flag.desc}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Side-by-Side Comparison Matrix -->
        ${state.comparisonMode ? `
          <div class="glass-panel p-6 rounded-3xl mb-8 overflow-x-auto animate-fade-in no-print shadow-md">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-sm text-[var(--text-main)]">⚖️ Full 5-Option Comparison Matrix</h3>
              <span class="text-xs text-[var(--text-muted)]">Swipe horizontally if on mobile</span>
            </div>
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
                ${res.rankedList.map(opt => `
                  <tr class="${opt.key === currentOpt.key ? 'bg-emerald-50/60 dark:bg-emerald-950/30 font-bold' : ''}">
                    <td class="py-3 px-3">
                      <span class="px-2 py-1 rounded-full text-[11px] font-bold ${opt.badgeClass}">
                        ${opt.icon} #${opt.rank} ${opt.name}
                      </span>
                    </td>
                    <td class="py-3 px-3 font-extrabold text-sm text-emerald-700 dark:text-emerald-400">${opt.score}%</td>
                    <td class="py-3 px-3 text-[var(--text-main)]">${opt.costEstimate}</td>
                    <td class="py-3 px-3 text-[var(--text-muted)]">${opt.time}</td>
                    <td class="py-3 px-3">${opt.difficulty}</td>
                    <td class="py-3 px-3 text-[var(--text-muted)]">${opt.ecoImpact}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- 5 Ranked Option Cards with Visual Score Progress Bars -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
              All 5 Ranked Options (Tap card to inspect action plan)
            </h3>
            <span class="text-xs text-[var(--text-muted)]">Currently inspecting: <strong>${currentOpt.name}</strong></span>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            ${res.rankedList.map(opt => `
              <div 
                class="option-card ${opt.key === currentOpt.key ? 'selected' : ''} ${opt.rank === 1 ? 'top-ranked' : ''}"
                data-option="${opt.key}"
              >
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[11px] font-black uppercase px-2 py-0.5 rounded-full ${opt.badgeClass}">
                    #${opt.rank} ${opt.name}
                  </span>
                  <span class="text-sm font-black text-emerald-700 dark:text-emerald-400">${opt.score}%</span>
                </div>

                <!-- Animated Score Track -->
                <div class="score-track">
                  <div class="score-fill" style="width: ${opt.score}%; background: ${opt.fillColor};"></div>
                </div>
                
                <p class="text-xs text-[var(--text-muted)] line-clamp-2 my-2 leading-relaxed">
                  ${opt.why}
                </p>

                <div class="text-[11px] flex items-center justify-between text-[var(--text-faint)] border-t border-[var(--border-subtle)] pt-1.5 mt-2">
                  <span>${opt.costEstimate}</span>
                  <span>${opt.time}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Plan Details & Simulator Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          
          <!-- Left 2 Cols: Checklist & DIY Steps -->
          <div class="lg:col-span-2 glass-panel p-6 md:p-8 rounded-3xl flex flex-col gap-6 shadow-md">
            
            <div class="border-b border-[var(--border-subtle)] pb-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-xs font-black px-2.5 py-1 rounded-full ${currentOpt.badgeClass}">
                    ${currentOpt.icon} #${currentOpt.rank} Path
                  </span>
                  <h3 class="text-xl md:text-2xl font-bold text-[var(--text-main)]">${currentOpt.name} Checklist</h3>
                </div>
                <span class="text-xs text-[var(--text-muted)] font-semibold">${currentOpt.time} • ${currentOpt.difficulty}</span>
              </div>
              <p class="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">${currentOpt.why}</p>
            </div>

            <!-- Pros & Cons -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                <span class="font-bold text-emerald-800 dark:text-emerald-300 block mb-1.5 text-sm">👍 Advantages:</span>
                <ul class="list-disc list-inside space-y-1 text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
                  ${currentOpt.pros.map(p => `<li>${p}</li>`).join('')}
                </ul>
              </div>

              <div class="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <span class="font-bold text-amber-800 dark:text-amber-300 block mb-1.5 text-sm">⚖️ Trade-offs:</span>
                <ul class="list-disc list-inside space-y-1 text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                  ${currentOpt.cons.map(c => `<li>${c}</li>`).join('')}
                </ul>
              </div>
            </div>

            <!-- Action Checklist -->
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-3">
                Actionable Next Steps
              </h4>
              <div class="space-y-2">
                ${currentOpt.checklist.map((step, idx) => `
                  <label class="flex items-start gap-3 p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-alt)] hover:border-emerald-600 transition cursor-pointer">
                    <input type="checkbox" class="mt-0.5 w-4 h-4 rounded text-emerald-600 accent-emerald-600" />
                    <span class="text-xs font-medium text-[var(--text-main)] leading-relaxed">${idx + 1}. ${step}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- DIY Walkthrough for Repair -->
            ${currentOpt.key === 'repair' ? `
              <div class="mt-2 border-t border-[var(--border-subtle)] pt-5">
                <h4 class="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-3 flex items-center gap-2">
                  <span>🛠️ Guided DIY Mini-Tutorial</span>
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  ${res.diySteps.map((s, idx) => `
                    <div class="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-alt)]">
                      <div class="flex items-center gap-2 mb-1.5">
                        <span class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">${idx + 1}</span>
                        <span class="text-xs font-bold text-[var(--text-main)]">${s.title}</span>
                      </div>
                      <p class="text-xs text-[var(--text-muted)] leading-relaxed">${s.desc}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

          </div>

          <!-- Right Col: Simulator & Session History -->
          <div class="flex flex-col gap-6 no-print">
            
            <!-- Live Simulator -->
            <div class="glass-panel p-5 md:p-6 rounded-3xl border-2 border-emerald-500/40 shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  🎛️ "What If...?" Simulator
                </h3>
                <span class="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">Live Re-scoring</span>
              </div>
              <p class="text-xs text-[var(--text-muted)] mb-4">
                Tweak parameters to watch how rankings and fit scores shift in real time.
              </p>

              <div class="space-y-4 text-xs">
                <!-- Severity Slider/Toggle -->
                <div>
                  <div class="flex justify-between mb-1.5 font-bold text-[var(--text-main)]">
                    <span>Severity</span>
                    <span id="simSevDisplay" class="capitalize text-emerald-600">${res.item.severity}</span>
                  </div>
                  <div class="grid grid-cols-3 gap-1.5">
                    ${['minor', 'moderate', 'severe'].map(s => `
                      <button type="button" class="sim-sev-btn py-1.5 px-2 rounded-xl border text-[11px] capitalize font-medium ${res.item.severity === s ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]'}" data-sev="${s}">
                        ${s}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <!-- Condition Toggle -->
                <div>
                  <div class="flex justify-between mb-1.5 font-bold text-[var(--text-main)]">
                    <span>Condition</span>
                    <span id="simCondDisplay" class="capitalize text-emerald-600">${res.item.condition}</span>
                  </div>
                  <div class="grid grid-cols-4 gap-1">
                    ${['excellent', 'good', 'fair', 'poor'].map(c => `
                      <button type="button" class="sim-cond-btn py-1.5 px-1 rounded-xl border text-[10px] capitalize font-medium text-center ${res.item.condition === c ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]'}" data-cond="${c}">
                        ${c}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <!-- Age Slider -->
                <div>
                  <div class="flex justify-between mb-1.5 font-bold text-[var(--text-main)]">
                    <span>Age</span>
                    <span id="simAgeDisplay" class="text-emerald-600">${res.item.age} yrs</span>
                  </div>
                  <input type="range" id="simAgeSlider" min="0.5" max="15" step="0.5" value="${res.item.age}" class="w-full accent-emerald-600 cursor-pointer" />
                </div>

                <!-- Sentimental Checkbox -->
                <div class="pt-2 border-t border-[var(--border-subtle)]">
                  <label class="flex items-center gap-2 cursor-pointer font-semibold text-[var(--text-main)] text-xs">
                    <input type="checkbox" id="simSentimental" ${res.item.sentimental ? 'checked' : ''} class="w-4 h-4 accent-emerald-600 rounded" />
                    <span>Sentimental Value Attached</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Session History -->
            <div class="glass-panel p-5 rounded-3xl shadow-sm">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  Session History (${state.sessionHistory.length})
                </h3>
                ${state.sessionHistory.length > 0 ? `
                  <button id="btnClearHistory" class="text-[10px] text-rose-500 font-bold hover:underline">Clear</button>
                ` : ''}
              </div>

              ${state.sessionHistory.length === 0 ? `
                <p class="text-xs text-[var(--text-muted)]">No previous items yet.</p>
              ` : `
                <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
                  ${state.sessionHistory.map((itemHistory, idx) => `
                    <div 
                      class="history-item-btn p-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-alt)] hover:border-emerald-600 transition cursor-pointer flex items-center justify-between text-xs"
                      data-idx="${idx}"
                    >
                      <div>
                        <div class="font-bold text-[var(--text-main)]">${escapeHtml(itemHistory.item.name)}</div>
                        <div class="text-[10px] text-[var(--text-muted)] mt-0.5">Top: ${itemHistory.topOption.name} (${itemHistory.topOption.score}%)</div>
                      </div>
                      <span class="text-[10px] text-[var(--text-faint)]">${itemHistory.timestamp}</span>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>

          </div>

        </div>

      </section>
    `;

    document.querySelectorAll('.option-card').forEach(card => {
      card.addEventListener('click', () => {
        state.selectedOptionKey = card.getAttribute('data-option');
        renderResultsScreen(container);
      });
    });

    document.getElementById('btnNewAssessment').addEventListener('click', () => {
      state.item = {
        name: '',
        category: 'furniture',
        age: 3,
        condition: 'good',
        brand: '',
        sentimental: false,
        description: '',
        severity: 'moderate',
        issues: [],
        replaceCost: 180
      };
      state.results = null;
      state.currentStep = 2;
      renderApp();
    });

    document.getElementById('btnToggleComparison').addEventListener('click', () => {
      state.comparisonMode = !state.comparisonMode;
      renderResultsScreen(container);
    });

    document.getElementById('btnToggleFavorite').addEventListener('click', () => {
      toggleFavorite(res);
      renderResultsScreen(container);
    });

    document.getElementById('btnShareSummary').addEventListener('click', () => {
      shareSummary(res);
    });

    document.getElementById('btnPrintSummary').addEventListener('click', () => {
      window.print();
    });

    document.querySelectorAll('.history-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        if (state.sessionHistory[idx]) {
          state.results = state.sessionHistory[idx];
          state.item = state.results.item;
          state.selectedOptionKey = state.results.topOption.key;
          renderResultsScreen(container);
        }
      });
    });

    const clearHistBtn = document.getElementById('btnClearHistory');
    if (clearHistBtn) {
      clearHistBtn.addEventListener('click', () => {
        state.sessionHistory = [];
        sessionStorage.removeItem('fif_session_history');
        renderResultsScreen(container);
      });
    }

    document.querySelectorAll('.sim-sev-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.item.severity = btn.getAttribute('data-sev');
        state.results = evaluateItem(state.item);
        renderResultsScreen(container);
      });
    });

    document.querySelectorAll('.sim-cond-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.item.condition = btn.getAttribute('data-cond');
        state.results = evaluateItem(state.item);
        renderResultsScreen(container);
      });
    });

    const simAgeSlider = document.getElementById('simAgeSlider');
    if (simAgeSlider) {
      simAgeSlider.addEventListener('input', (e) => {
        state.item.age = parseFloat(e.target.value);
        state.results = evaluateItem(state.item);
        renderResultsScreen(container);
      });
    }

    const simSentimental = document.getElementById('simSentimental');
    if (simSentimental) {
      simSentimental.addEventListener('change', (e) => {
        state.item.sentimental = e.target.checked;
        state.results = evaluateItem(state.item);
        renderResultsScreen(container);
      });
    }
  }

  function addToSessionHistory(resObj) {
    if (state.sessionHistory.length > 0 && state.sessionHistory[0].item.name === resObj.item.name) {
      state.sessionHistory[0] = resObj;
    } else {
      state.sessionHistory.unshift(resObj);
    }
    try {
      sessionStorage.setItem('fif_session_history', JSON.stringify(state.sessionHistory));
    } catch (e) {}
  }

  function toggleFavorite(resObj) {
    const existingIndex = state.favorites.findIndex(f => f.name === resObj.item.name && f.timestamp === resObj.timestamp);
    if (existingIndex >= 0) {
      state.favorites.splice(existingIndex, 1);
      showToast('Removed from favorites');
    } else {
      state.favorites.push({
        name: resObj.item.name,
        category: resObj.item.category,
        topOption: resObj.topOption.name,
        score: resObj.topOption.score,
        savings: resObj.savings,
        timestamp: resObj.timestamp
      });
      showToast('Saved to favorites! ⭐');
    }
    localStorage.setItem('fif_favorites', JSON.stringify(state.favorites));
  }

  function shareSummary(resObj) {
    const text = `🌿 Fix It First Assessment:\nItem: ${resObj.item.name} (${resObj.item.age} yrs old)\nTop Option: ${resObj.topOption.name} (${resObj.topOption.score}% fit)\nWhy: ${resObj.topOption.why}\nPotential Savings: ~$${resObj.savings} | Eco Impact: Avoids ~${resObj.co2Saved} kg CO2\n"Think before you throw."`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard! 📋');
      }).catch(() => {
        prompt('Copy assessment summary:', text);
      });
    } else {
      prompt('Copy assessment summary:', text);
    }
  }

  function showToast(msg) {
    const existing = document.getElementById('fifToast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'fifToast';
    toast.className = 'fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-emerald-950 text-white text-xs font-bold shadow-2xl border border-emerald-700 animate-fade-in flex items-center gap-2';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
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

  // INIT
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const stored = sessionStorage.getItem('fif_session_history');
      if (stored) state.sessionHistory = JSON.parse(stored);
    } catch (e) {}

    const themeBtn = document.getElementById('btnThemeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('fif_theme', state.theme);
        applyTheme();
        themeBtn.textContent = state.theme === 'dark' ? '☀️' : '🌙';
      });
      themeBtn.textContent = (state.theme === 'dark' || (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? '☀️' : '🌙';
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

    renderApp();
  });

})();

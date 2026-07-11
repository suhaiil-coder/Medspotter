export interface NeuroSubQuestion {
  q: string;
  marks: number;
  answer: string;
}

export interface NeuroSpotter {
  id: string;
  stationNo: string;
  topic: string;
  scenario: string;
  thumbnail: string;
  totalMarks: number;
  questions: NeuroSubQuestion[];
}

export const NEURO_SPOTTERS: NeuroSpotter[] = [
  {
    id: "na001",
    stationNo: "NA-1",
    topic: "Anterolateral Sulcus of Medulla Oblongata",
    scenario: "A specimen of the brainstem is shown. The pinned area is on the anterior surface of the medulla oblongata.",
    thumbnail: "na001_anterolateral_sulcus",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the pinned area.",
        marks: 2,
        answer: "Anterolateral sulcus of medulla oblongata.",
      },
      {
        q: "Mention the cranial nerve related to it.",
        marks: 2,
        answer: "Cranial nerve XII — Hypoglossal nerve. Its rootlets emerge from the anterolateral sulcus (between the pyramid and olive).",
      },
    ],
  },
  {
    id: "na002",
    stationNo: "NA-2",
    topic: "Basilar Artery",
    scenario: "A specimen of the base of the brain is shown. The pinned structure lies in the midline on the anterior surface of the pons.",
    thumbnail: "na002_basilar_artery",
    totalMarks: 6,
    questions: [
      {
        q: "Identify the pinned structure.",
        marks: 2,
        answer: "Basilar artery.",
      },
      {
        q: "Give its formation.",
        marks: 2,
        answer: "Formed by the union of the right and left vertebral arteries at the lower border of the pons.",
      },
      {
        q: "Mention its branches.",
        marks: 2,
        answer: "1. Pontine branches\n2. Anterior inferior cerebellar artery (AICA)\n3. Labyrinthine artery\n4. Superior cerebellar artery (SCA)\n5. Posterior cerebral artery (PCA) — terminal branches",
      },
    ],
  },
  {
    id: "na003",
    stationNo: "NA-3",
    topic: "Basilar Sulcus",
    scenario: "A specimen of the brainstem is shown. The pinned area is a shallow midline groove on the anterior surface of the pons.",
    thumbnail: "na003_basilar_sulcus",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the pinned area.",
        marks: 2,
        answer: "Basilar sulcus.",
      },
      {
        q: "Give its content.",
        marks: 2,
        answer: "Basilar artery.",
      },
    ],
  },
  {
    id: "na004",
    stationNo: "NA-4",
    topic: "Cauda Equina",
    scenario: "A specimen of the lower end of the vertebral canal is shown. A cluster of nerve roots is tied together below the conus medullaris.",
    thumbnail: "na004_cauda_equina",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the tied structure.",
        marks: 2,
        answer: "Cauda equina.",
      },
      {
        q: "What does it consist of?",
        marks: 2,
        answer: "Roots of the lower four pairs of lumbar nerves (L2–L5), five pairs of sacral nerves (S1–S5), and one pair of coccygeal nerves — all contained within the lumbar cistern.",
      },
    ],
  },
  {
    id: "na005",
    stationNo: "NA-5",
    topic: "Central Sulcus",
    scenario: "A specimen of the lateral surface of the cerebral hemisphere is shown. The pinned area is a prominent sulcus running obliquely from the medial surface downward and forward.",
    thumbnail: "na005_central_sulcus",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the pinned area.",
        marks: 2,
        answer: "Central sulcus (Rolandic sulcus / Sulcus of Rolando).",
      },
      {
        q: "Mention its functional importance.",
        marks: 2,
        answer: "Forms the boundary between the primary motor area (precentral gyrus — area 4 of Brodmann) in front and the primary somatosensory area (postcentral gyrus — areas 3,1,2) behind.",
      },
    ],
  },
  {
    id: "na006",
    stationNo: "NA-6",
    topic: "Cerebellum",
    scenario: "A specimen showing the largest part of the hindbrain is presented. It occupies the posterior cranial fossa behind the brainstem.",
    thumbnail: "na006_cerebellum",
    totalMarks: 8,
    questions: [
      {
        q: "Identify the pinned structure.",
        marks: 2,
        answer: "Cerebellum.",
      },
      {
        q: "Name its deep nuclei.",
        marks: 2,
        answer: "1. Dentate nucleus (largest)\n2. Emboliform nucleus\n3. Globose nucleus\n4. Fastigial nucleus (smallest, most medial)",
      },
      {
        q: "Give its blood supply.",
        marks: 2,
        answer: "Arterial supply:\n1. Superior cerebellar artery (SCA) — from basilar artery\n2. Anterior inferior cerebellar artery (AICA) — from basilar artery\n3. Posterior inferior cerebellar artery (PICA) — from vertebral artery",
      },
      {
        q: "Give its applied anatomy.",
        marks: 2,
        answer: "Cerebellar syndrome:\n• Truncal ataxia (midline lesions)\n• Hypotonia\n• Asynergia\n• Dysmetria (past-pointing)\n• Dysarthria (scanning speech)\n• Dysdiadochokinesis\n• Intention tremor\n• Nystagmus",
      },
    ],
  },
  {
    id: "na007",
    stationNo: "NA-7",
    topic: "Cerebral Peduncle",
    scenario: "A specimen of the midbrain is shown. The pinned structure forms the large anterior pillar of the midbrain.",
    thumbnail: "na007_cerebral_peduncle",
    totalMarks: 6,
    questions: [
      {
        q: "Identify the pinned structure.",
        marks: 2,
        answer: "Cerebral peduncle.",
      },
      {
        q: "Give its parts.",
        marks: 2,
        answer: "1. Crus cerebri (basis pedunculi) — anterior\n2. Substantia nigra — intermediate\n3. Tegmentum — posterior",
      },
      {
        q: "Mention the cranial nerves related to it.",
        marks: 2,
        answer: "1. Oculomotor nerve (CN III) — emerges from the interpeduncular fossa between the two peduncles\n2. Trochlear nerve (CN IV) — winds around the lateral surface of the peduncle",
      },
    ],
  },
  {
    id: "na008",
    stationNo: "NA-8",
    topic: "Filum Terminale",
    scenario: "A specimen of the lower end of the spinal cord is shown. A fine thread-like structure is tied at the tip of the conus medullaris.",
    thumbnail: "na008_filum_terminale",
    totalMarks: 8,
    questions: [
      {
        q: "Identify the tied structure.",
        marks: 2,
        answer: "Filum terminale.",
      },
      {
        q: "What is it made up of?",
        marks: 2,
        answer: "It is a modification of pia mater — a slender thread of fibrous tissue continuous with the pia mater of the spinal cord.",
      },
      {
        q: "Give its parts and length.",
        marks: 2,
        answer: "1. Filum terminale internum — 15 cm; within the lumbar cistern, surrounded by the cauda equina\n2. Filum terminale externum (coccygeal ligament) — 5 cm; pierces the dura, blends with the periosteum of the coccyx",
      },
      {
        q: "Mention its extent.",
        marks: 2,
        answer: "From the tip of the conus medullaris (at the level of L1 vertebra) to the first coccygeal vertebra (Co1).",
      },
    ],
  },
  {
    id: "na009",
    stationNo: "NA-9",
    topic: "Inferior Cerebellar Peduncle",
    scenario: "A specimen of the brainstem is shown. The pinned structure connects the medulla to the cerebellum.",
    thumbnail: "na009_inf_cerebellar_peduncle",
    totalMarks: 6,
    questions: [
      {
        q: "Identify the pinned structure.",
        marks: 2,
        answer: "Inferior cerebellar peduncle (restiform body).",
      },
      {
        q: "What does it connect?",
        marks: 2,
        answer: "It connects the medulla oblongata with the cerebellum.",
      },
      {
        q: "Name any four fibres present in it.",
        marks: 2,
        answer: "Afferent fibres:\n1. Posterior spinocerebellar tract\n2. Olivocerebellar fibres\n3. Cuneocerebellar fibres\n4. Vestibulocerebellar fibres\n5. Reticulocerebellar fibres\n\nEfferent fibres:\n1. Cerebellovestibular\n2. Cerebelloreticular\n3. Cerebello-olivary",
      },
    ],
  },
  {
    id: "na010",
    stationNo: "NA-10",
    topic: "Interpeduncular Fossa",
    scenario: "A specimen of the base of the brain is shown. The pinned area is a diamond-shaped space between the cerebral peduncles.",
    thumbnail: "na010_interpeduncular_fossa",
    totalMarks: 6,
    questions: [
      {
        q: "Identify the pinned area.",
        marks: 2,
        answer: "Interpeduncular fossa.",
      },
      {
        q: "Mention its boundaries.",
        marks: 2,
        answer: "• Anteriorly: optic chiasma\n• Anterolaterally: optic tract\n• Posterolaterally: crus cerebri of cerebral peduncle\n• Posteriorly: upper border of pons",
      },
      {
        q: "Give its contents.",
        marks: 2,
        answer: "1. Tuber cinereum\n2. Mammillary bodies\n3. Infundibulum\n4. Posterior perforated substance (perforated by central branches of posterior cerebral artery)\n5. Oculomotor nerve (CN III)",
      },
    ],
  },
  {
    id: "na011",
    stationNo: "NA-11",
    topic: "Internal Capsule",
    scenario: "A horizontal section through the cerebral hemisphere is shown. The pinned structure is a compact band of white matter lying between the basal ganglia and thalamus.",
    thumbnail: "na011_internal_capsule",
    totalMarks: 12,
    questions: [
      {
        q: "Identify the pinned structure.",
        marks: 2,
        answer: "Internal capsule.",
      },
      {
        q: "Mention its boundaries.",
        marks: 2,
        answer: "• Medial: caudate nucleus and thalamus\n• Lateral: lentiform nucleus (globus pallidus + putamen)",
      },
      {
        q: "Give its parts.",
        marks: 2,
        answer: "1. Anterior limb\n2. Genu\n3. Posterior limb\n4. Retrolentiform part\n5. Sublentiform part",
      },
      {
        q: "Mention the fibres passing through it.",
        marks: 2,
        answer: "Motor fibres: corticospinal, corticonuclear, corticopontine\nSensory fibres: thalamocortical fibres\nOther: optic radiation (retrolentiform), auditory radiation (sublentiform)",
      },
      {
        q: "Give its blood supply.",
        marks: 2,
        answer: "1. Medial and lateral striate branches of middle cerebral artery\n2. Striate branches of anterior cerebral artery\n3. Central branches of anterior choroidal artery\n4. Central branches of posterior communicating artery\n5. Posterolateral central branches of posterior cerebral artery",
      },
      {
        q: "Give its applied anatomy.",
        marks: 2,
        answer: "Lesion of the internal capsule causes contralateral hemiplegia (affecting face, upper and lower limb), along with visual defects (homonymous hemianopia) and auditory defects due to interruption of respective radiations.",
      },
    ],
  },
  {
    id: "na012",
    stationNo: "NA-12",
    topic: "Internal Carotid Artery",
    scenario: "A specimen of the base of the brain with vessels intact is shown. The orange arrow marks a major artery entering the cranial cavity.",
    thumbnail: "na012_internal_carotid_artery",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the orange arrow marked structure.",
        marks: 2,
        answer: "Internal carotid artery.",
      },
      {
        q: "Name its branches.",
        marks: 2,
        answer: "1. Ophthalmic artery\n2. Posterior communicating artery\n3. Anterior choroidal artery\n4. Anterior cerebral artery\n5. Middle cerebral artery (terminal branch)",
      },
    ],
  },
  {
    id: "na013",
    stationNo: "NA-13",
    topic: "Ligamentum Denticulatum",
    scenario: "A specimen of the spinal cord within the dura is shown. A serrated band of pia mater is identified by the black arrow.",
    thumbnail: "na013_ligamentum_denticulatum",
    totalMarks: 6,
    questions: [
      {
        q: "Identify the black arrow marked structure.",
        marks: 2,
        answer: "Ligamentum denticulatum (denticulate ligament).",
      },
      {
        q: "What is it made up of?",
        marks: 2,
        answer: "It is a modification of pia mater — a thin lateral sheet of pia with 21 tooth-like processes (denticulations) that pierce the arachnoid and attach to the inner surface of the dura.",
      },
      {
        q: "Give its function.",
        marks: 2,
        answer: "1. Anchors the spinal cord in the middle of the subarachnoid space, preventing rotational movement.\n2. Serves as a surgical guide to the neurosurgeon during cordotomy (anterolateral cordotomy), as it demarcates anterior from posterior nerve rootlets.",
      },
    ],
  },
  {
    id: "na014",
    stationNo: "NA-14",
    topic: "Middle Cerebellar Peduncle",
    scenario: "A specimen of the brainstem is shown. The pinned structure is the largest of the three cerebellar peduncles, connecting the pons to the cerebellum.",
    thumbnail: "na014_mid_cerebellar_peduncle",
    totalMarks: 6,
    questions: [
      {
        q: "Identify the pinned structure.",
        marks: 2,
        answer: "Middle cerebellar peduncle (brachium pontis).",
      },
      {
        q: "What does it connect?",
        marks: 2,
        answer: "It connects the pons with the cerebellum.",
      },
      {
        q: "Name the fibres present in it.",
        marks: 2,
        answer: "Entirely afferent (to cerebellum): pontocerebellar fibres — axons of pontine nuclei that have crossed the midline, carrying corticopontine information from the contralateral cerebral cortex.",
      },
    ],
  },
  {
    id: "na015",
    stationNo: "NA-15",
    topic: "Broca's Motor Speech Area",
    scenario: "A specimen of the lateral surface of the left cerebral hemisphere is shown. The pinned area is on the inferior frontal gyrus.",
    thumbnail: "na015_brocas_area",
    totalMarks: 6,
    questions: [
      {
        q: "Identify the pinned area.",
        marks: 2,
        answer: "Broca's motor speech area — pars triangularis of the inferior frontal gyrus (in the dominant hemisphere, usually left).",
      },
      {
        q: "Give its functional area.",
        marks: 2,
        answer: "Brodmann areas 44 and 45. It controls the motor programming of speech production — coordinating the movements of the lips, tongue, and larynx needed for articulate speech.",
      },
      {
        q: "Mention its applied anatomy.",
        marks: 2,
        answer: "Lesion → Motor (expressive/non-fluent) aphasia (Broca's aphasia): patient understands language but cannot produce fluent speech; speech is halting, telegraphic, and effortful.",
      },
    ],
  },
  {
    id: "na016",
    stationNo: "NA-16",
    topic: "Olive",
    scenario: "A specimen of the anterior surface of the medulla oblongata is shown. The pinned structure is an oval prominence lateral to the pyramid.",
    thumbnail: "na016_olive",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the pinned structure.",
        marks: 2,
        answer: "Olive (olivary eminence).",
      },
      {
        q: "Name the structure present underlying it.",
        marks: 2,
        answer: "Inferior olivary nucleus — a large, crumpled-bag shaped nucleus whose axons form the olivocerebellar tract (major afferent to the cerebellum).",
      },
    ],
  },
  {
    id: "na017",
    stationNo: "NA-17",
    topic: "Pons",
    scenario: "A specimen of the brainstem is shown. The pinned structure is the middle and widest part, lying between the midbrain above and medulla below.",
    thumbnail: "na017_pons",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the pinned structure.",
        marks: 2,
        answer: "Pons (pons Varolii).",
      },
      {
        q: "Name the cranial nerve related to it.",
        marks: 2,
        answer: "Trigeminal nerve — CN V (the largest cranial nerve), which is attached to the anterior surface of the pons at the junction of the basal pons and the middle cerebellar peduncle.",
      },
    ],
  },
  {
    id: "na018",
    stationNo: "NA-18",
    topic: "Pontomedullary Junction",
    scenario: "A specimen of the brainstem is shown. The pinned area is the groove between the pons and the medulla oblongata.",
    thumbnail: "na018_pontomedullary_junction",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the pinned area.",
        marks: 2,
        answer: "Pontomedullary junction (bulbopontine sulcus).",
      },
      {
        q: "Name the cranial nerves related to it.",
        marks: 2,
        answer: "Medial to lateral order:\n1. Abducent nerve — CN VI (most medial)\n2. Facial nerve — CN VII\n3. Vestibulocochlear nerve — CN VIII (most lateral)",
      },
    ],
  },
  {
    id: "na019",
    stationNo: "NA-19",
    topic: "Postcentral Gyrus",
    scenario: "A specimen of the lateral surface of the cerebral hemisphere is shown. The pinned area is a vertical strip of cortex immediately behind the central sulcus.",
    thumbnail: "na019_postcentral_gyrus",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the pinned area.",
        marks: 2,
        answer: "Postcentral gyrus.",
      },
      {
        q: "Mention its functional importance and functional area.",
        marks: 2,
        answer: "Primary somatosensory (sensory) area — receives conscious sensations of touch, pain, temperature, and proprioception from the contralateral half of the body.\nFunctional area: Brodmann areas 3 (posterior bank of central sulcus), 1, and 2.",
      },
    ],
  },
  {
    id: "na020",
    stationNo: "NA-20",
    topic: "Posterior Ramus of Lateral Sulcus",
    scenario: "A specimen of the lateral surface of the cerebral hemisphere is shown. The pinned area is the long posterior limb of the lateral (Sylvian) sulcus.",
    thumbnail: "na020_lateral_sulcus",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the pinned area.",
        marks: 2,
        answer: "Posterior ramus of the lateral sulcus (Sylvian fissure).",
      },
      {
        q: "Give its contents.",
        marks: 2,
        answer: "1. Middle cerebral artery (MCA) and its branches\n2. Deep middle cerebral vein",
      },
    ],
  },
  {
    id: "na021",
    stationNo: "NA-21",
    topic: "Posterolateral Sulcus of Medulla Oblongata",
    scenario: "A specimen of the posterior surface of the medulla oblongata is shown. The pinned area is a longitudinal groove on the posterolateral aspect.",
    thumbnail: "na021_posterolateral_sulcus",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the pinned area.",
        marks: 2,
        answer: "Posterolateral sulcus of medulla oblongata.",
      },
      {
        q: "Name the cranial nerves related to it.",
        marks: 2,
        answer: "From above downwards:\n1. Glossopharyngeal nerve — CN IX\n2. Vagus nerve — CN X\n3. Accessory nerve — CN XI (cranial root)",
      },
    ],
  },
  {
    id: "na022",
    stationNo: "NA-22",
    topic: "Precentral Gyrus",
    scenario: "A specimen of the lateral surface of the cerebral hemisphere is shown. The pinned area is the gyrus immediately anterior to the central sulcus.",
    thumbnail: "na022_precentral_gyrus",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the pinned area.",
        marks: 2,
        answer: "Precentral gyrus.",
      },
      {
        q: "Give its functional area.",
        marks: 2,
        answer: "Primary motor cortex — Area 4 of Brodmann. Contains the motor homunculus; controls voluntary skeletal muscle movements of the contralateral half of the body via the corticospinal and corticonuclear tracts.",
      },
    ],
  },
  {
    id: "na023",
    stationNo: "NA-23",
    topic: "Pyramid of Medulla Oblongata",
    scenario: "A specimen of the anterior surface of the medulla oblongata is shown. The pinned structure is the longitudinal ridge on either side of the anterior median fissure.",
    thumbnail: "na023_pyramid",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the pinned structure.",
        marks: 2,
        answer: "Pyramid of the medulla oblongata.",
      },
      {
        q: "Name the structure present underlying it.",
        marks: 2,
        answer: "Corticospinal (pyramidal) fibres — the large descending motor tract carrying voluntary motor impulses from the motor cortex. At the lower end of the medulla, ~85% of these fibres cross in the pyramidal decussation.",
      },
    ],
  },
  {
    id: "na024",
    stationNo: "NA-24",
    topic: "Wernicke's Sensory Speech Area",
    scenario: "A specimen of the lateral surface of the dominant cerebral hemisphere is shown. The pinned area is the posterior part of the superior temporal gyrus.",
    thumbnail: "na024_wernickes_area",
    totalMarks: 6,
    questions: [
      {
        q: "Identify the pinned area.",
        marks: 2,
        answer: "Wernicke's sensory speech area (posterior language area).",
      },
      {
        q: "Give its functional area.",
        marks: 2,
        answer: "Brodmann areas 39 (angular gyrus) and 40 (supramarginal gyrus), at the temporoparietal junction of the dominant hemisphere. Responsible for comprehension of spoken and written language.",
      },
      {
        q: "Mention its applied anatomy.",
        marks: 2,
        answer: "Lesion → Sensory (receptive/fluent) aphasia (Wernicke's aphasia): patient speaks fluently but with meaningless content (paraphasia, neologisms) and cannot comprehend spoken or written language.",
      },
    ],
  },
  {
    id: "na025",
    stationNo: "NA-25",
    topic: "Spinal Cord",
    scenario: "A specimen of the entire spinal cord removed from the vertebral canal is presented.",
    thumbnail: "na025_spinal_cord",
    totalMarks: 8,
    questions: [
      {
        q: "Identify the given organ.",
        marks: 2,
        answer: "Spinal cord.",
      },
      {
        q: "Give its extent.",
        marks: 2,
        answer: "From the upper border of the atlas (C1) to the lower border of the L1 vertebra (or upper border of L2) where it tapers as the conus medullaris.",
      },
      {
        q: "Give its coverings.",
        marks: 2,
        answer: "Three meninges (from outside in):\n1. Dura mater (tough, outermost)\n2. Arachnoid mater (middle, avascular)\n3. Pia mater (delicate, highly vascular, directly covers the cord)",
      },
      {
        q: "Mention its arterial supply.",
        marks: 2,
        answer: "1. One anterior spinal artery (from vertebral arteries)\n2. Two posterior spinal arteries (from vertebral or PICA)\n3. Segmental medullary arteries (from vertebral, intercostal, lumbar arteries) — reinforcing the longitudinal vessels, notably the artery of Adamkiewicz at T9–L1",
      },
    ],
  },
  {
    id: "na026",
    stationNo: "NA-26",
    topic: "Superior Temporal Gyrus",
    scenario: "A specimen of the lateral surface of the cerebral hemisphere is shown. The pinned area is the most superior gyrus of the temporal lobe.",
    thumbnail: "na026_superior_temporal_gyrus",
    totalMarks: 4,
    questions: [
      {
        q: "Identify the given area.",
        marks: 2,
        answer: "Superior temporal gyrus.",
      },
      {
        q: "Give its functional importance and functional area.",
        marks: 2,
        answer: "The primary auditory cortex is situated in the superior surface (Heschl's gyri) of the superior temporal gyrus.\n• Primary auditory area: Brodmann areas 41 and 42\n• Secondary auditory area: Brodmann area 22 (involved in auditory association and language comprehension — part of Wernicke's area)",
      },
    ],
  },
];

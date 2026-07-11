import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { NEURO_SPOTTERS, type NeuroSpotter, type NeuroSubQuestion } from "@/constants/neuroQuestions";

const { width: SCREEN_W } = Dimensions.get("window");
const ACCENT = "#8B5CF6";

// ─── Image map ────────────────────────────────────────────────────────────────

const NEURO_IMAGES: Record<string, any> = {
  na001_anterolateral_sulcus:   require("@/assets/images/neuro/na001_anterolateral_sulcus.png"),
  na002_basilar_artery:         require("@/assets/images/neuro/na002_basilar_artery.png"),
  na003_basilar_sulcus:         require("@/assets/images/neuro/na003_basilar_sulcus.png"),
  na004_cauda_equina:           require("@/assets/images/neuro/na004_cauda_equina.png"),
  na005_central_sulcus:         require("@/assets/images/neuro/na005_central_sulcus.png"),
  na006_cerebellum:             require("@/assets/images/neuro/na006_cerebellum.png"),
  na007_cerebral_peduncle:      require("@/assets/images/neuro/na007_cerebral_peduncle.png"),
  na008_filum_terminale:        require("@/assets/images/neuro/na008_filum_terminale.png"),
  na009_inf_cerebellar_peduncle:require("@/assets/images/neuro/na009_inf_cerebellar_peduncle.png"),
  na010_interpeduncular_fossa:  require("@/assets/images/neuro/na010_interpeduncular_fossa.png"),
  na011_internal_capsule:       require("@/assets/images/neuro/na011_internal_capsule.png"),
  na012_internal_carotid_artery:require("@/assets/images/neuro/na012_internal_carotid_artery.png"),
  na013_ligamentum_denticulatum:require("@/assets/images/neuro/na013_ligamentum_denticulatum.png"),
  na014_mid_cerebellar_peduncle:require("@/assets/images/neuro/na014_mid_cerebellar_peduncle.png"),
  na015_brocas_area:            require("@/assets/images/neuro/na015_brocas_area.png"),
  na016_olive:                  require("@/assets/images/neuro/na016_olive.png"),
  na017_pons:                   require("@/assets/images/neuro/na017_pons.png"),
  na018_pontomedullary_junction:require("@/assets/images/neuro/na018_pontomedullary_junction.png"),
  na019_postcentral_gyrus:      require("@/assets/images/neuro/na019_postcentral_gyrus.png"),
  na020_lateral_sulcus:         require("@/assets/images/neuro/na020_lateral_sulcus.png"),
  na021_posterolateral_sulcus:  require("@/assets/images/neuro/na021_posterolateral_sulcus.png"),
  na022_precentral_gyrus:       require("@/assets/images/neuro/na022_precentral_gyrus.png"),
  na023_pyramid:                require("@/assets/images/neuro/na023_pyramid.png"),
  na024_wernickes_area:         require("@/assets/images/neuro/na024_wernickes_area.png"),
  na025_spinal_cord:            require("@/assets/images/neuro/na025_spinal_cord.png"),
  na026_superior_temporal_gyrus:require("@/assets/images/neuro/na026_superior_temporal_gyrus.png"),
};

// ─── Spotter list card ────────────────────────────────────────────────────────

function SpotterCard({
  spotter,
  onPress,
}: {
  spotter: NeuroSpotter;
  onPress: () => void;
}) {
  const colors = useColors();
  const img = NEURO_IMAGES[spotter.thumbnail];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.spotterCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      {/* Image thumbnail */}
      <View style={styles.spotterCardImg}>
        {img && (
          <Image source={img} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.72)"]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.stationNo, { backgroundColor: ACCENT }]}>
          <Text style={styles.stationNoTxt}>{spotter.stationNo}</Text>
        </View>
        <View style={styles.marksChip}>
          <Text style={styles.marksChipTxt}>{spotter.totalMarks}M</Text>
        </View>
      </View>

      {/* Text */}
      <View style={styles.spotterCardBody}>
        <Text style={[styles.spotterTopic, { color: colors.foreground }]} numberOfLines={2}>
          {spotter.topic}
        </Text>
        <Text style={[styles.spotterQCount, { color: colors.mutedForeground }]}>
          {spotter.questions.length} question{spotter.questions.length !== 1 ? "s" : ""}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Question row ─────────────────────────────────────────────────────────────

function QuestionRow({
  q,
  index,
  forceReveal,
}: {
  q: NeuroSubQuestion;
  index: number;
  forceReveal: boolean;
}) {
  const colors = useColors();
  const [revealed, setRevealed] = useState(false);
  const show = revealed || forceReveal;

  return (
    <View
      style={[
        styles.qRow,
        { backgroundColor: colors.card, borderColor: show ? ACCENT + "55" : colors.border },
      ]}
    >
      <View style={styles.qHeader}>
        <View style={[styles.qNumBadge, { backgroundColor: ACCENT + "22" }]}>
          <Text style={[styles.qNum, { color: ACCENT }]}>{index + 1}</Text>
        </View>
        <Text style={[styles.qText, { color: colors.foreground }]}>{q.q}</Text>
        <View style={[styles.marksBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.marksTxt, { color: colors.mutedForeground }]}>{q.marks}M</Text>
        </View>
      </View>

      {show ? (
        <View style={[styles.answerBox, { backgroundColor: ACCENT + "11", borderColor: ACCENT + "33" }]}>
          <View style={styles.answerHeader}>
            <Feather name="check-circle" size={14} color={ACCENT} />
            <Text style={[styles.answerLabel, { color: ACCENT }]}>MODEL ANSWER</Text>
          </View>
          <Text style={[styles.answerText, { color: colors.foreground }]}>{q.answer}</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => setRevealed(true)}
          style={({ pressed }) => [
            styles.revealBtn,
            { borderColor: ACCENT + "55", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="eye" size={14} color={ACCENT} />
          <Text style={[styles.revealTxt, { color: ACCENT }]}>Reveal Answer</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Spotter detail view ──────────────────────────────────────────────────────

function SpotterDetail({
  spotter,
  onBack,
}: {
  spotter: NeuroSpotter;
  onBack: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const img = NEURO_IMAGES[spotter.thumbnail];
  const [allRevealed, setAllRevealed] = useState(false);
  const [revealKey, setRevealKey] = useState(0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 80 : insets.bottom + 80 }}
      >
        {/* Hero image */}
        <View style={styles.detailHero}>
          {img && (
            <Image source={img} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          )}
          <LinearGradient
            colors={[ACCENT + "44", "rgba(0,0,0,0.88)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Back button */}
          <View
            style={[
              styles.detailTopBar,
              { paddingTop: Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top + 8 },
            ]}
          >
            <Pressable
              onPress={onBack}
              style={[styles.backBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]}
            >
              <Feather name="arrow-left" size={18} color="#fff" />
            </Pressable>
            <View style={[styles.stationNoBig, { backgroundColor: ACCENT }]}>
              <Text style={styles.stationNoBigTxt}>{spotter.stationNo}</Text>
            </View>
          </View>

          {/* Meta */}
          <View style={styles.detailHeroContent}>
            <View style={[styles.neuroPill, { backgroundColor: ACCENT + "33" }]}>
              <Text style={[styles.neuroPillTxt, { color: ACCENT }]}>Neuroanatomy</Text>
            </View>
            <Text style={styles.detailTitle}>{spotter.topic}</Text>
            <Text style={styles.detailMarks}>
              {spotter.totalMarks} total marks · {spotter.questions.length} question
              {spotter.questions.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Scenario */}
        <View style={[styles.scenarioBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.scenarioHeader}>
            <Feather name="image" size={14} color={ACCENT} />
            <Text style={[styles.scenarioLabel, { color: ACCENT }]}>SPECIMEN</Text>
          </View>
          <Text style={[styles.scenarioText, { color: colors.foreground }]}>{spotter.scenario}</Text>
        </View>

        {/* Reveal all */}
        <View style={styles.revealAllRow}>
          <Text style={[styles.questionsHeading, { color: colors.foreground }]}>Questions</Text>
          <Pressable
            key={revealKey}
            onPress={() => {
              setAllRevealed(true);
              setRevealKey((k) => k + 1);
            }}
            style={[styles.revealAllBtn, { backgroundColor: ACCENT + "22", borderColor: ACCENT + "44" }]}
          >
            <Feather name="eye" size={13} color={ACCENT} />
            <Text style={[styles.revealAllTxt, { color: ACCENT }]}>Reveal All</Text>
          </Pressable>
        </View>

        {/* Questions */}
        <View style={styles.questionsList}>
          {spotter.questions.map((q, i) => (
            <QuestionRow key={`${revealKey}-${i}`} q={q} index={i} forceReveal={allRevealed} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NeuroQuizScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const [activeSpotter, setActiveSpotter] = useState<NeuroSpotter | null>(null);

  if (activeSpotter) {
    return (
      <SpotterDetail spotter={activeSpotter} onBack={() => setActiveSpotter(null)} />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[ACCENT + "CC", colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtnHeader, { backgroundColor: "rgba(255,255,255,0.15)" }]}
        >
          <Feather name="arrow-left" size={18} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Neuroanatomy</Text>
          <Text style={styles.headerSub}>
            {NEURO_SPOTTERS.length} spotters · Identify & Describe
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <Text style={styles.countTxt}>{NEURO_SPOTTERS.length}</Text>
        </View>
      </LinearGradient>

      {/* Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: Platform.OS === "web" ? 80 : insets.bottom + 80 },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Tap a spotter to view the specimen and reveal model answers
        </Text>
        {NEURO_SPOTTERS.map((spotter) => (
          <SpotterCard
            key={spotter.id}
            spotter={spotter}
            onPress={() => setActiveSpotter(spotter)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  backBtnHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#fff",
    letterSpacing: -0.4,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  countBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  countTxt: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#fff",
  },

  sectionLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 16,
    textAlign: "center",
  },

  grid: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },

  spotterCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
  },
  spotterCardImg: {
    width: 110,
    height: 90,
  },
  stationNo: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stationNoTxt: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#fff",
    letterSpacing: 0.4,
  },
  marksChip: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  marksChipTxt: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: "#fff",
  },
  spotterCardBody: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
    gap: 4,
  },
  spotterTopic: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: -0.2,
  },
  spotterQCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },

  // Detail view
  detailHero: {
    height: 280,
    justifyContent: "flex-end",
  },
  detailTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stationNoBig: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  stationNoBigTxt: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#fff",
    letterSpacing: 0.5,
  },
  detailHeroContent: {
    padding: 20,
    gap: 6,
  },
  neuroPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  neuroPillTxt: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  detailTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#fff",
    letterSpacing: -0.4,
  },
  detailMarks: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },

  scenarioBox: {
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  scenarioHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scenarioLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1,
  },
  scenarioText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },

  revealAllRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  questionsHeading: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  revealAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  revealAllTxt: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },

  questionsList: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 20,
  },

  qRow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  qHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  qNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  qNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  qText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  marksBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    flexShrink: 0,
  },
  marksTxt: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },

  answerBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  answerLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1,
  },
  answerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },

  revealBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  revealTxt: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});

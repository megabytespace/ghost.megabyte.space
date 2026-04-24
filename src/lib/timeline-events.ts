import type { StoryMilestone, TimelineAnnotation } from "../types";

export const timelineAnnotations: TimelineAnnotation[] = [
  {
    id: "usb-bridge-online",
    date: "2026-04-03T02:47:58.394637+00:00",
    title: "USB bridge online",
    subtitle: "The GQ EMF390 feed became readable inside Home Assistant through the USB Hardware Bridge.",
    kind: "technical",
  },
  {
    id: "public-api-launch",
    date: "2026-04-23T23:00:00.000000+00:00",
    title: "Public API build-out",
    subtitle: "The sensor feed was prepared for public Cloudflare-cached access and full-range browsing.",
    kind: "technical",
  },
];

export const storyMilestones: StoryMilestone[] = [
  {
    id: "avatar-mud-era",
    eraLabel: "Early internet",
    title: "AVATAR MUD, teenage internet life, and the first rupture",
    subtitle: "The story traces some of the earliest confusion to adolescence, internet relationships, and strangers appearing too close to home.",
    body: "This milestone anchors the fictional narrative in early internet life while the public-facing technical layer stays grounded in sensor data, dated notes, and direct polling.",
  },
  {
    id: "avatar-identity-frame",
    eraLabel: "Identity",
    title: "From AVATAR MUD to an 'avatar' frame",
    subtitle: "He describes a long-running sense of being larger than his circumstances, harder to contain, and pulled toward a mission bigger than ordinary life.",
    body: "Here, 'avatar' is story language for intensity, burden, self-belief, and a mission that keeps expanding as the years pass.",
  },
  {
    id: "early-following-phase",
    eraLabel: "Early phase",
    title: "License plates, tension, and pattern recognition",
    subtitle: "A self-described period of repeated signs, being followed, and trying to interpret what was happening.",
    body: "The plot treats this as the start of a long pattern-recognition spiral while the measurable layer remains the sensor data itself.",
  },
  {
    id: "joker-survival-phase",
    eraLabel: "Survival energy",
    title: "Joker laughter, chain smoking, and white-van symbolism",
    subtitle: "A period he describes as chaotic, theatrical, and spiritually charged.",
    body: "This chapter keeps the original theatrical survival energy intact: cackling, smoking, a white van turned into a white chariot, and the feeling that the pressure had become mythic.",
  },
  {
    id: "dallas-recovery-phase",
    eraLabel: "Recovery",
    title: "Dallas, recovery, and gym intensity",
    subtitle: "A chapter associated with recovery, discipline, alarms, and a sense of amplified physical force.",
    body: "The story arc is included because it explains why the feed exists. The public API remains grounded in timestamps, values, and reproducible polling.",
  },
  {
    id: "gondor-recurrence",
    eraLabel: "Recurrence",
    title: "The '4 GONDOR' recurrence",
    subtitle: "A repeated sign he says was witnessed across state lines by more than one family member.",
    body: "This is one of the story's strongest recurrence motifs: the kind of sign that feels too specific to ignore once it happens twice.",
  },
  {
    id: "dreams-and-coincidence-load",
    eraLabel: "Dream burden",
    title: "Vivid dreams, animal imagery, and coincidence overload",
    subtitle: "He reports bizarre dreams, unsettling physical sensations on waking, and a life story that felt saturated with disturbing coincidences.",
    body: "This chapter holds the more disturbing dream material, the shaggy ghost dog, and the sense that his life ranks unusually high in raw coincidence load.",
  },
  {
    id: "service-and-calmness",
    eraLabel: "Service",
    title: "St. John's Soup Kitchen, calmness, and pattern shifts",
    subtitle: "He ties part of the story to volunteering near Newark Penn Station and to a growing belief that calmness changes how the world responds to him.",
    body: "This chapter includes the soup kitchen, the oldest church in Newark, and the memory of multi-colored bags seeming to switch over to black bags as if the scene had been edited in place.",
  },
  {
    id: "time-travel-theory-frame",
    eraLabel: "Theory",
    title: "A CERN-bound conversation and the time-travel question",
    subtitle: "A chance encounter with a scientist headed to CERN pushed the story toward time travel as a theoretical possibility.",
    body: "From there, the narrative starts treating teleportation, stale data, and delayed causality as part of the same cosmic question.",
  },
  {
    id: "future-unsolved-mystery",
    eraLabel: "Backlash",
    title: "Backlash, certainty, and the future unsolved mystery",
    subtitle: "He says the story is real to him, expects people to push back hard, and leans into becoming a mystery people still have to solve later.",
    body: "This milestone keeps the line in the supplied frame: the story may anger people, invite dismissal, or trigger talk of a psych ward, but it still gets presented as part of the site's fictional record.",
  },
  {
    id: "political-mission",
    eraLabel: "Mission",
    title: "Presidential ambition and anti-establishment politics",
    subtitle: "He connects the story to a broader political mission, including a long-running desire to challenge systems he sees as manipulative or corrupt.",
    body: "That mission language is part of the site's autobiographical frame. It remains separate from the measurable API, which exists so other people can inspect the data directly.",
  },
  {
    id: "animal-safety",
    eraLabel: "Boundary",
    title: "No harm, especially to animals",
    subtitle: "The feed is not a weapon, oracle, or excuse for abuse.",
    body: "Do not use this dataset to rationalize cruelty. Do not abuse any animals. Do not use pattern-seeking as a pretext for harm.",
  },
];

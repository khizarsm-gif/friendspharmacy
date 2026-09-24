import {
  Activity, Apple, Baby, Bandage, Bone, Brain, Cross, Droplet, Dumbbell, Ear, Eye,
  Flower2, Heart, HeartPulse, Leaf, Pill, Shield, ShowerHead, Smile, Sparkles,
  Stethoscope, Sun, Syringe, Thermometer, type LucideIcon,
} from "lucide-react";

/**
 * Icons an admin can pick for a category. Keys are stored in the
 * `categories.icon` column. Keeping an explicit list (instead of importing
 * every lucide icon) keeps the page bundles small.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Pill, Sparkles, ShowerHead, Baby, Flower2, Stethoscope, Cross, HeartPulse,
  Heart, Activity, Thermometer, Syringe, Bandage, Droplet, Leaf, Apple,
  Dumbbell, Brain, Eye, Ear, Smile, Bone, Sun, Shield,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Pill;
}

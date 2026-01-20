import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, Check } from "lucide-react";

type GoalType = "lose" | "maintain" | "gain";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Profile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.getProfile(),
  });

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    heightCm: "",
    sex: "male",
    activityLevel: "moderately_active",
    weeklyGoal: 0,
  });

  const [selectedGoal, setSelectedGoal] = useState<GoalType>("maintain");

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        age: profile.age?.toString() || "",
        heightCm: profile.heightCm?.toString() || "",
        sex: profile.sex || "male",
        activityLevel: profile.activityLevel || "moderately_active",
        weeklyGoal: profile.weeklyGoal || 0,
      });

      if (profile.weeklyGoal && profile.weeklyGoal < 0) {
        setSelectedGoal("lose");
      } else if (profile.weeklyGoal && profile.weeklyGoal > 0) {
        setSelectedGoal("gain");
      } else {
        setSelectedGoal("maintain");
      }
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      api.updateProfile({
        name: data.name,
        age: data.age ? parseInt(data.age) : undefined,
        heightCm: data.heightCm ? parseFloat(data.heightCm) : undefined,
        sex: data.sex,
        activityLevel: data.activityLevel,
        weeklyGoal: data.weeklyGoal,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGoalSelect = (goal: GoalType) => {
    setSelectedGoal(goal);
    let weeklyGoal = 0;
    if (goal === "lose") weeklyGoal = -0.5;
    if (goal === "gain") weeklyGoal = 0.5;
    setFormData((prev) => ({ ...prev, weeklyGoal }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="mb-8 pt-4">
        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-1">
          Profile
        </h1>
      </header>

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src="" />
            <AvatarFallback className="text-lg font-bold">
              {getInitials(formData.name || "User")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your name"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-heading font-bold">Physical Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heightCm">Height (cm)</Label>
              <Input
                id="heightCm"
                type="number"
                value={formData.heightCm}
                onChange={(e) => handleInputChange("heightCm", e.target.value)}
                placeholder="180"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                placeholder="28"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Gender</Label>
              <select
                id="sex"
                value={formData.sex}
                onChange={(e) => handleInputChange("sex", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activityLevel">Activity Level</Label>
              <select
                id="activityLevel"
                value={formData.activityLevel}
                onChange={(e) => handleInputChange("activityLevel", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="sedentary">Sedentary</option>
                <option value="lightly_active">Lightly Active</option>
                <option value="moderately_active">Moderately Active</option>
                <option value="very_active">Very Active</option>
                <option value="extremely_active">Extremely Active</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-heading font-bold">Goals</h3>
          <div className="space-y-2">
            <Label>Weekly Goal</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={selectedGoal === "lose" ? "default" : "outline"}
                className={`h-auto py-4 flex flex-col gap-1 ${
                  selectedGoal === "lose" ? "ring-2 ring-offset-2 ring-primary" : ""
                }`}
                onClick={() => handleGoalSelect("lose")}
              >
                <span className="font-bold">Lose</span>
                <span
                  className={`text-xs ${
                    selectedGoal === "lose" ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  Weight
                </span>
              </Button>
              <Button
                type="button"
                variant={selectedGoal === "maintain" ? "default" : "outline"}
                className={`h-auto py-4 flex flex-col gap-1 ${
                  selectedGoal === "maintain" ? "ring-2 ring-offset-2 ring-primary" : ""
                }`}
                onClick={() => handleGoalSelect("maintain")}
              >
                <span className="font-bold">Maintain</span>
                <span
                  className={`text-xs ${
                    selectedGoal === "maintain" ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  Physique
                </span>
              </Button>
              <Button
                type="button"
                variant={selectedGoal === "gain" ? "default" : "outline"}
                className={`h-auto py-4 flex flex-col gap-1 ${
                  selectedGoal === "gain" ? "ring-2 ring-offset-2 ring-primary" : ""
                }`}
                onClick={() => handleGoalSelect("gain")}
              >
                <span className="font-bold">Gain</span>
                <span
                  className={`text-xs ${
                    selectedGoal === "gain" ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  Muscle
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : updateMutation.isSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}

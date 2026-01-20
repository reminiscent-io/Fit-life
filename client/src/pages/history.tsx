import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, WorkoutSession } from "@/lib/api";
import { format } from "date-fns";
import { useState } from "react";

export default function History() {
  const queryClient = useQueryClient();
  const [editSession, setEditSession] = useState<WorkoutSession | null>(null);
  const [deleteSession, setDeleteSession] = useState<WorkoutSession | null>(null);
  const [editName, setEditName] = useState("");

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.getSessions(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      api.updateSession(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setEditSession(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setDeleteSession(null);
    },
  });

  const calculateDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return null;
    const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000 / 60;
    return Math.round(duration);
  };

  const handleEditClick = (session: WorkoutSession) => {
    setEditSession(session);
    setEditName(session.name || "");
  };

  const handleSaveEdit = () => {
    if (editSession) {
      updateMutation.mutate({ id: editSession.id, name: editName });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteSession) {
      deleteMutation.mutate(deleteSession.id);
    }
  };

  return (
    <Layout>
       <header className="mb-6 pt-4">
        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-1">
          History
        </h1>
        <p className="text-muted-foreground">Your past workouts</p>
      </header>

      <div className="space-y-4">
        {sessions && sessions.length > 0 ? (
          sessions.map((session) => {
            const duration = calculateDuration(session.startTime, session.endTime);
            return (
              <Card key={session.id} className="border-none shadow-sm hover:bg-accent/5 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-heading text-lg font-bold">
                        {session.name || "Workout Session"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(session.date), "PPP")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditClick(session)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteSession(session)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                    {duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {duration} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="font-bold text-foreground">{session.exercises?.length || 0}</span> exercises
                    </span>
                  </div>

                  {session.exercises && session.exercises.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-border">
                      {session.exercises.map((ex) => (
                        <div key={ex.id} className="flex justify-between text-sm">
                          <span className="font-medium">{ex.exerciseName}</span>
                          <span className="text-muted-foreground">
                            {ex.sets}x{ex.reps} @ {ex.weight || 0} {ex.weightUnit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground py-8">No workout history yet</p>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editSession} onOpenChange={(open) => !open && setEditSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workout</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Workout Name</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter workout name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSession(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSession} onOpenChange={(open) => !open && setDeleteSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteSession?.name || "Workout Session"}"?
              This will permanently remove the workout and all its exercises. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

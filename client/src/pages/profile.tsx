import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
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
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold font-heading">Alex L.</h2>
            <p className="text-muted-foreground">Fitness Enthusiast</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-heading font-bold">Physical Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current Weight (lbs)</Label>
              <Input defaultValue="192.4" />
            </div>
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input defaultValue="180" />
            </div>
            <div className="space-y-2">
              <Label>Age</Label>
              <Input defaultValue="28" />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
               <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        </div>

         <div className="space-y-4">
          <h3 className="text-lg font-heading font-bold">Goals</h3>
          <div className="space-y-2">
            <Label>Weekly Goal</Label>
            <div className="grid grid-cols-3 gap-2">
               <Button variant="outline" className="h-auto py-4 flex flex-col gap-1">
                 <span className="font-bold">Lose</span>
                 <span className="text-xs text-muted-foreground">Weight</span>
               </Button>
               <Button variant="default" className="h-auto py-4 flex flex-col gap-1 ring-2 ring-offset-2 ring-primary">
                 <span className="font-bold">Maintain</span>
                 <span className="text-xs text-primary-foreground/80">Physique</span>
               </Button>
               <Button variant="outline" className="h-auto py-4 flex flex-col gap-1">
                 <span className="font-bold">Gain</span>
                 <span className="text-xs text-muted-foreground">Muscle</span>
               </Button>
            </div>
          </div>
        </div>
        
        <div className="pt-4">
           <Button className="w-full" size="lg">Save Changes</Button>
        </div>
      </div>
    </Layout>
  );
}

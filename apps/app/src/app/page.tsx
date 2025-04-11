"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Game {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Zod schema for game creation
const gameFormSchema = z.object({
  name: z.string().min(1, { message: "Game name is required" }).max(100, { message: "Game name must be less than 100 characters" }),
  description: z.string().max(500, { message: "Description must be less than 500 characters" }).optional(),
});

// TypeScript type from the zod schema
type GameFormValues = z.infer<typeof gameFormSchema>;

export default function HomePage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/games");
        
        if (!res.ok) {
          throw new Error("Failed to fetch games");
        }
        
        const gamesData = await res.json();
        setGames(gamesData);
      } catch (err: any) {
        console.error("Error fetching games:", err);
        // Don't show error if the database is empty
        if (err.message !== "Failed to fetch games") {
          setError(err.message);
        }
        // Set games to empty array to avoid showing loading state forever
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // Create a new game with form validation
  const onSubmit = async (data: GameFormValues) => {
    try {
      setSubmitting(true);
      setError(null);
      
      const res = await fetch("/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
        }),
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        // Handle specific errors
        if (responseData.error) {
          if (responseData.error.includes("database") || responseData.error.includes("connect")) {
            throw new Error("Database connection error. Please check your database setup.");
          } else {
            throw new Error(responseData.error);
          }
        } else {
          throw new Error("Failed to create game. Please try again.");
        }
      }
      
      // Close drawer and redirect to the game editor
      form.reset();
      setDrawerOpen(false);
      router.push(`/game/${responseData.id}`);
    } catch (err: any) {
      console.error("Error creating game:", err);
      setError(err.message);
      
      // Show alert for database connection issues
      if (err.message.includes("database") || err.message.includes("Failed to create game")) {
        // Keep the drawer open but show the error
        console.warn("Database issue detected. The database might not be set up correctly.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form when drawer closes
  useEffect(() => {
    if (!drawerOpen) {
      form.reset();
    }
  }, [drawerOpen, form]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-950">
      <div className="container mx-auto py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10"
        >
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              Game Projects
            </h1>
            <p className="text-zinc-400 mt-2">Design, build, and launch your next gaming masterpiece</p>
          </div>
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button 
                size="lg" 
                className="gap-2 shadow-md bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 border-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create New Game
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-zinc-900 border-t-emerald-900">
              <DrawerHeader className="border-b border-zinc-800 pb-4">
                <DrawerTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Create New Game</DrawerTitle>
                <DrawerDescription className="text-zinc-400">
                  Fill in the details to create your new game project
                </DrawerDescription>
              </DrawerHeader>
              <ScrollArea className="h-[60vh] px-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300">Game Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter game name"
                              className="bg-zinc-800 border-zinc-700 focus:border-emerald-500 text-white placeholder:text-zinc-500"
                              disabled={submitting}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300">Description (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe your game"
                              className="bg-zinc-800 border-zinc-700 focus:border-emerald-500 text-white placeholder:text-zinc-500"
                              rows={5}
                              disabled={submitting}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </ScrollArea>
              <DrawerFooter className="border-t border-zinc-800 pt-4">
                {error && (
                  <div className="p-3 mb-3 bg-red-900/20 rounded border border-red-800 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <Button 
                  type="submit" 
                  onClick={form.handleSubmit(onSubmit)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Creating Game...
                    </>
                  ) : (
                    'Create Game'
                  )}
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </motion.div>

        {error && !drawerOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 mb-6 bg-red-900/20 border border-red-800 text-red-400 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {/* Game list */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-emerald-500"></div>
            <p className="text-zinc-400 mt-6">Loading your game projects...</p>
          </div>
        ) : games.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-32 h-32 rounded-full bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500/50">
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No Games Yet</h2>
            <p className="text-zinc-400 max-w-md">
              Create your first game project to get started on your development journey
            </p>
            <Button 
              onClick={() => setDrawerOpen(true)}
              className="mt-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              Let's build together
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="h-full"
              >
                <Link href={`/game/${game.id}`} className="block h-full">
                  <Card className="h-full group bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-emerald-800/50 transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl text-white group-hover:text-emerald-400 transition-colors duration-300">
                        {game.name}
                      </CardTitle>
                      {game.description && (
                        <CardDescription className="line-clamp-2 mt-1 text-zinc-400">{game.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow pt-2">
                      <div className="w-full h-px bg-zinc-800 group-hover:bg-emerald-800/30 transition-colors duration-300"></div>
                    </CardContent>
                    <CardFooter className="flex justify-between text-sm text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {formatDate(game.createdAt)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m18 21-6-4-6 4V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16z" />
                        </svg>
                        {formatDate(game.updatedAt)}
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

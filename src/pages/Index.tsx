import { useQuery } from "@tanstack/react-query";
import { jobsApi, candidatesApi } from "@/lib/api";
import { Briefcase, Users, TrendingUp, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Index() {
  const { data: jobsData } = useQuery({
    queryKey: ["jobs", "active"],
    queryFn: () => jobsApi.getAll({ status: "active" }),
  });

  const { data: candidatesData } = useQuery({
    queryKey: ["candidates", "all"],
    queryFn: () => candidatesApi.search({}),
  });

  const activeJobs = jobsData?.data?.length || 0;
  const totalCandidates = candidatesData?.data?.length || 0;
  const appliedCandidates =
    candidatesData?.data?.filter((c: any) => c.stage === "applied").length || 0;
  const inReview =
    candidatesData?.data?.filter((c: any) =>
      ["screen", "tech"].includes(c.stage)
    ).length || 0;

  const stats = [
    {
      title: "Active Jobs",
      value: activeJobs,
      description: "Open positions",
      icon: Briefcase,
      trend: "+12% from last month",
      href: "/jobs",
    },
    {
      title: "Total Candidates",
      value: totalCandidates,
      description: "In pipeline",
      icon: Users,
      trend: `${appliedCandidates} new applications`,
      href: "/candidates",
    },
    {
      title: "In Review",
      value: inReview,
      description: "Active interviews",
      icon: Clock,
      trend: "Across all stages",
      href: "/candidates",
    },
    {
      title: "Success Rate",
      value: "68%",
      description: "Offer acceptance",
      icon: TrendingUp,
      trend: "+5% from last quarter",
      href: "/candidates",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of hiring pipeline.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.href}>
              <Card className="transition-all hover:shadow-md cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                  <p className="text-xs text-primary mt-2 font-medium">
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/jobs">
              <Button variant="outline" className="w-full justify-start">
                <Briefcase className="mr-2 h-4 w-4" />
                Create New Job
              </Button>
            </Link>
            <Link to="/candidates">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Review Candidates
              </Button>
            </Link>
            <Link to="/assessments">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Build Assessment
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in your pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New candidate applied</p>
                  <p className="text-xs text-muted-foreground">
                    Senior Frontend Engineer • 5 minutes ago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Interview scheduled</p>
                  <p className="text-xs text-muted-foreground">
                    Backend Developer • 1 hour ago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-success mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Offer accepted</p>
                  <p className="text-xs text-muted-foreground">
                    Full Stack Developer • 3 hours ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

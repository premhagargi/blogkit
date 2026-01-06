"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from "lucide-react";
import { FormContext } from "../context/form-context";
import { useContext } from "react";

export default function FormAction() {
  const { setActiveTab } = useContext(FormContext);

  return (
    <Card className="border-none shadow-none p-0">
      <CardHeader className="p-0">
        <CardTitle className="font-medium font-main">Action</CardTitle>
        <p className="text-small">Text instructions will appear here.</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
          <Code className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-small">
            Feature Coming Soon
          </p>
        </div>
      </CardContent>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setActiveTab("confirmation")}>
          ← Back
        </Button>
        <Button>Save</Button>
      </div>
    </Card>
  );
}

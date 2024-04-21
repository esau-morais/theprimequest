"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ChevronLeft } from "lucide-react";
import { createUser } from "@/lib/actions/room.actions";
import { useFormState } from "react-dom";
import { cn } from "@/lib/utils";

const initialState = {
  errors: {
    nickname: [],
  },
};

export const NickanameForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomType = searchParams.get("room");

  const [state, formAction] = useFormState(createUser, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center space-x-1">
          <Button
            className="size-fit"
            size="icon"
            variant="ghost"
            onClick={() => router.back()}
          >
            <ChevronLeft size={20} />
          </Button>
          <span>
            {roomType?.startsWith("create") ? "Create room" : "Join room"}
          </span>
        </CardTitle>
        <CardDescription>
          Before continuing, make sure to set a nickname
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form action={formAction}>
          <Label
            htmlFor="nickname"
            className={cn(
              "text-right",
              Object.keys(state?.errors?.nickname || {}).length > 0 &&
                "text-destructive",
            )}
          >
            nickname
          </Label>
          <Input id="nickname" name="nickname" placeholder="@_3morais" />
          {state?.errors ? (
            <p className="text-[0.8rem] font-medium text-destructive">
              {state?.errors.nickname?.[0]}
            </p>
          ) : null}
          <Button className="mt-6" type="submit">
            Go to lobby
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
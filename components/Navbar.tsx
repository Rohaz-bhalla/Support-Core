"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { ModeToggle } from "./ModeToggle";
import { PlusIcon } from "lucide-react";
import { useChat } from "@/components/chat-context";

export function Navbar() {
  const { newChat } = useChat();

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between border-b bg-background px-4 py-2 shadow-sm">
      {/* App Title */}
      <h1 className="text-lg font-semibold tracking-tight">
        Spur Support AI
      </h1>

      {/* Menu */}
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Chat Functions</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={newChat}>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Chat
            </MenubarItem>

            {/* <MenubarSeparator /> */}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* Theme Toggle */}
      <ModeToggle />
    </div>
  );
}


import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from 'react';

// Simple component to test
function Welcome({ name }: { name: string }) {
    return <h1>Hello, {name}!</h1>;
}

describe("Welcome Component", () => {
    it("renders the welcome message", () => {
        render(<Welcome name="ArtLine" />);
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello, ArtLine!");
    });
});

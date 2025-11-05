"use client";
import { Container, Box } from "@mui/material";
import DataTable from "@/components/DataTable";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <ThemeToggle />
      </Box>
      <DataTable />
    </Container>
  );
}

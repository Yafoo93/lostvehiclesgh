import SearchForm from "@/components/forms/SearchForm";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Lost Vehicle Registry Ghana</h1>
      <p>
        Search a vehicle by VIN or engine number to check whether it has been
        reported stolen.
      </p>

      <SearchForm />
    </main>
  );
}
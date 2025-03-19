import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./careServices.module.css";

export default function CareServices() {
  // --------------------------------
  // 1. State
  // --------------------------------
  const [allProviders, setAllProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [category, setCategory] = useState("babysitters"); // 'babysitters' or 'nannies'

  // Sorting
  const [sortBy, setSortBy] = useState("rating");
  const sortOptions = [
    { id: "rating", label: "Top Rated" },
    { id: "hourly_rate_asc", label: "Lowest Price" },
    { id: "hourly_rate_desc", label: "Highest Price" },
    { id: "hired_count", label: "Most Hired" },
  ];

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // --------------------------------
  // 2. Fetch data with Bearer token
  // --------------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) API base URL (from .env or fallback)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      // 2) Full endpoint (ensure your server has a route GET /v1/careServices)
      const finalUrl = `${apiUrl}/v1/careServices`;

      // 3) Retrieve the token (stored after login)
      // Make sure you actually set localStorage.setItem("accessToken", token) somewhere after login
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : "";

      // 4) Make the request with Bearer token
      const response = await fetch(finalUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // crucial for auth
        },
      });

      if (!response.ok) {
        // e.g. 401 => Unauthorized, 404 => Not found, etc.
        throw new Error(`Failed to fetch. Status: ${response.status}`);
      }

      // 5) Parse the response
      // Expecting { providers: [...] } or { data: { providers: [...] } }
      const data = await response.json();
      const providers = data.providers || data.data?.providers || [];
      setAllProviders(providers);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error fetching providers");
      setAllProviders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch once on mount
  useEffect(() => {
    fetchData();
  }, []);

  // --------------------------------
  // 3. Client-side Filtering & Sorting
  // --------------------------------

  // 3.1 Filter by category
  const providersByCategory = allProviders.filter(
    (provider) => provider.provider_type === category,
  );

  // 3.2 Filter by city
  const providersByCity = cityFilter.trim()
    ? providersByCategory.filter((provider) =>
        provider.city?.toLowerCase().includes(cityFilter.toLowerCase()),
      )
    : providersByCategory;

  // 3.3 Filter by search term (name, bio, city)
  const providersBySearch = searchTerm.trim()
    ? providersByCity.filter((provider) => {
        const term = searchTerm.toLowerCase();
        return (
          provider.name?.toLowerCase().includes(term) ||
          provider.bio?.toLowerCase().includes(term) ||
          provider.city?.toLowerCase().includes(term)
        );
      })
    : providersByCity;

  // 3.4 Sort
  let sortedProviders = [...providersBySearch];
  switch (sortBy) {
    case "rating":
      sortedProviders.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case "hourly_rate_asc":
      sortedProviders.sort(
        (a, b) => (a.hourly_rate || 0) - (b.hourly_rate || 0),
      );
      break;
    case "hourly_rate_desc":
      sortedProviders.sort(
        (a, b) => (b.hourly_rate || 0) - (a.hourly_rate || 0),
      );
      break;
    case "hired_count":
      sortedProviders.sort(
        (a, b) => (b.hired_count || 0) - (a.hired_count || 0),
      );
      break;
    default:
      // Default to rating
      break;
  }

  // 3.5 Pagination
  const totalItems = sortedProviders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentStartIndex = (currentPage - 1) * itemsPerPage;
  const currentEndIndex = currentStartIndex + itemsPerPage;
  const currentProviders = sortedProviders.slice(
    currentStartIndex,
    currentEndIndex,
  );

  // --------------------------------
  // 4. Handlers
  // --------------------------------
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setCurrentPage(1);
  };

  const handleCityFilterChange = (e) => {
    setCityFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (sortId) => {
    setSortBy(sortId);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // --------------------------------
  // 5. Render
  // --------------------------------
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Find Childcare Services</h1>

      {/* Category Selection */}
      <div className={styles.categorySelector}>
        <button
          className={`${styles.categoryButton} ${
            category === "babysitters" ? styles.active : ""
          }`}
          onClick={() => handleCategoryChange("babysitters")}
        >
          Babysitters
        </button>
        <button
          className={`${styles.categoryButton} ${
            category === "nannies" ? styles.active : ""
          }`}
          onClick={() => handleCategoryChange("nannies")}
        >
          Nannies
        </button>
      </div>

      {/* Filter by City */}
      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Filter by city..."
          value={cityFilter}
          onChange={handleCityFilterChange}
          className={styles.searchInput}
        />
      </div>

      {/* Search */}
      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Search providers..."
          value={searchTerm}
          onChange={handleSearchChange}
          className={styles.searchInput}
          style={{ width: "100%" }}
        />
      </div>

      {/* Sorting Options */}
      <div className={styles.sortOptions}>
        {sortOptions.map((option) => (
          <button
            key={option.id}
            className={`${styles.sortButton} ${
              sortBy === option.id ? styles.active : ""
            }`}
            onClick={() => handleSortChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Loading, Error & Results */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading providers...</p>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <p>⚠️ {error}</p>
          <button className={styles.retryButton} onClick={fetchData}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          <p>
            Showing {currentProviders.length} of {totalItems} {category}
          </p>
          {currentProviders.length > 0 ? (
            <div className={styles.providersGrid}>
              {currentProviders.map((provider) => (
                <div key={provider.id} className={styles.providerCard}>
                  <div className={styles.providerHeader}>
                    <div className={styles.providerImage}>
                      {provider.profile_image ? (
                        <Image
                          src={provider.profile_image}
                          alt={provider.name || "Care provider"}
                          width={80}
                          height={80}
                          className={styles.profileImage}
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.jpg";
                          }}
                        />
                      ) : (
                        <div className={styles.placeholderImage}>
                          {provider.name ? provider.name.charAt(0) : "?"}
                        </div>
                      )}
                    </div>
                    <div className={styles.providerInfo}>
                      <h2>{provider.name || "Name unavailable"}</h2>
                      {provider.city && <p>{provider.city}</p>}
                      {provider.rating && (
                        <p>Rating: {Number(provider.rating).toFixed(1)} ⭐</p>
                      )}
                      {provider.verification && (
                        <span className={styles.verifiedBadge}>✔ Verified</span>
                      )}
                      {provider.is_premium && (
                        <span className={styles.premiumBadge}>Premium</span>
                      )}
                    </div>
                  </div>
                  {provider.title && (
                    <p className={styles.bio}>{provider.title}</p>
                  )}
                  {provider.experience && (
                    <p className={styles.experience}>
                      Experience: {provider.experience}
                    </p>
                  )}
                  {provider.hourly_rate && (
                    <p className={styles.hourlyRate}>
                      ${Number(provider.hourly_rate).toFixed(2)}/hr
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              No providers found matching your criteria. Try adjusting your
              filters.
            </div>
          )}

          {/* Pagination */}
          {totalItems > 0 && totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.paginationButton}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

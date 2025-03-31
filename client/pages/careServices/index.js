import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "./careServices.module.css";
import {
  toggleFavoriteProvider,
  getFavoriteProviders,
} from "../../services/addFavoriteChildcareService";

export default function CareServices() {
  const router = useRouter();

  // --------------------------------
  // 1. State
  // --------------------------------
  const [allProviders, setAllProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Favorites
  const [favoriteProviderIds, setFavoriteProviderIds] = useState([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [category, setCategory] = useState("all"); // 'all', 'babysitters' or 'nannies'

  // Sorting
  const [sortBy, setSortBy] = useState("rating");
  const sortOptions = [
    { id: "rating", label: "Top Rated" },
    { id: "hourly_rate_asc", label: "Lowest Price" },
    { id: "hourly_rate_desc", label: "Highest Price" },
    { id: "hired_count", label: "Most Hired" },
    { id: "experience", label: "Most Experience" },
  ];

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Message confirmation
  const [messageConfirmation, setMessageConfirmation] = useState({
    show: false,
    providerName: "",
  });

  // --------------------------------
  // 2. Authentication Check
  // --------------------------------
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        setError("Please log in to view care services");
        setLoading(false);
        return false;
      }

      // Basic token validation
      if (typeof token !== "string" || token.trim() === "") {
        setIsAuthenticated(false);
        setError("Invalid authentication token. Please log in again.");
        setLoading(false);
        localStorage.removeItem("token");
        return false;
      }

      setIsAuthenticated(true);
      return true;
    };

    const authStatus = checkAuth();
    if (authStatus) {
      fetchData();
      fetchFavorites();
    }
  }, []);

  // --------------------------------
  // 3. Fetch data with Bearer token
  // --------------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const finalUrl = `${apiUrl}/v1/careServices`;

      const response = await fetch(finalUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch. Status: ${response.status}`);
      }

      const data = await response.json();
      const providers = data.providers || data.data?.providers || [];
      setAllProviders(providers);
      setFilteredProviders(providers);
    } catch (err) {
      console.error("Error fetching providers:", err);
      setError(err.message || "Error fetching providers");
      setAllProviders([]);
      setFilteredProviders([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // 3.1 Fetch Favorites
  // --------------------------------
  const fetchFavorites = async () => {
    try {
      const favorites = await getFavoriteProviders();
      setFavoriteProviderIds(favorites || []);

      if (favorites.length > 0) {
        console.log(`Loaded ${favorites.length} favorites successfully`);
      } else {
        console.log("No favorites found for this user");
      }
    } catch (err) {
      console.error("Unexpected error fetching favorites:", err);
      setFavoriteProviderIds([]);
    }
  };

  // --------------------------------
  // 3.2 Enhanced Search Handler
  // --------------------------------
  const handleSearchChange = (e) => {
    const value = e.target.value.trim();
    setSearchTerm(value);
    setCurrentPage(1);

    // If search is empty, reset to all providers
    if (!value) {
      setFilteredProviders(allProviders);
      return;
    }

    // Convert search to lowercase for case-insensitive matching
    const lowercaseSearch = value.toLowerCase();

    // Comprehensive search across multiple fields
    const searchFilteredProviders = allProviders.filter((provider) => {
      const matchesName = provider.name
        ?.toLowerCase()
        .includes(lowercaseSearch);
      const matchesCity = provider.location
        ?.toLowerCase()
        .includes(lowercaseSearch);
      const matchesBio = provider.bio?.toLowerCase().includes(lowercaseSearch);
      const matchesTitle = provider.title
        ?.toLowerCase()
        .includes(lowercaseSearch);

      // Check if the provider matches any of the search criteria
      return matchesName || matchesCity || matchesBio || matchesTitle;
    });

    // Update filtered providers
    setFilteredProviders(searchFilteredProviders);
  };

  // Rest of the existing methods remain the same...

  // --------------------------------
  // 4. Client-side Filtering & Sorting
  // --------------------------------

  // 4.1 Filter by category
  const providersByCategory =
    category === "all"
      ? filteredProviders
      : filteredProviders.filter(
          (provider) => provider.provider_type === category,
        );

  // 4.2 Filter by favorites if selected
  const providersByFavorites = showOnlyFavorites
    ? providersByCategory.filter((provider) =>
        favoriteProviderIds.includes(provider.id),
      )
    : providersByCategory;

  // 4.3 Sort
  let sortedProviders = [...providersByFavorites];
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
    case "experience":
      sortedProviders.sort((a, b) => {
        const expA = a.experience ? parseInt(a.experience, 10) : 0;
        const expB = b.experience ? parseInt(b.experience, 10) : 0;
        return expB - expA;
      });
      break;
    default:
      sortedProviders.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
  }

  // 4.4 Pagination
  const totalItems = sortedProviders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentStartIndex = (currentPage - 1) * itemsPerPage;
  const currentEndIndex = currentStartIndex + itemsPerPage;
  const currentProviders = sortedProviders.slice(
    currentStartIndex,
    currentEndIndex,
  );

  // --------------------------------
  // 5. Handlers (unchanged)
  // --------------------------------
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
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

  const handleFavoritesFilterChange = (e) => {
    setShowOnlyFavorites(e.target.checked);
    setCurrentPage(1);
  };

  const handleLogin = () => {
    router.push("/login?redirect=" + encodeURIComponent(router.asPath));
  };

  const handleToggleFavorite = async (providerId) => {
    try {
      const isFavorite = !favoriteProviderIds.includes(providerId);

      // Optimistically update UI
      if (isFavorite) {
        setFavoriteProviderIds((prev) => [...prev, providerId]);
      } else {
        setFavoriteProviderIds((prev) =>
          prev.filter((id) => id !== providerId),
        );
      }

      // Call API with improved error handling
      const result = await toggleFavoriteProvider(providerId, isFavorite);

      if (!result.success) {
        // If API call failed, revert optimistic update
        console.error("Error toggling favorite:", result.message);

        if (isFavorite) {
          setFavoriteProviderIds((prev) =>
            prev.filter((id) => id !== providerId),
          );
        } else {
          setFavoriteProviderIds((prev) => [...prev, providerId]);
        }

        console.warn("Could not update favorite: " + result.message);
      } else {
        console.log(
          isFavorite ? "Added to favorites" : "Removed from favorites",
        );
      }
    } catch (err) {
      console.error("Unexpected error toggling favorite:", err);
      fetchFavorites();
    }
  };

  const handleSendMessage = (providerId, providerName) => {
    console.log(`Sending message to provider ${providerId}: ${providerName}`);

    setMessageConfirmation({
      show: true,
      providerName: providerName,
    });

    setTimeout(() => {
      setMessageConfirmation({
        show: false,
        providerName: "",
      });
    }, 3000);
  };

  const handleViewProfile = (profileUrl) => {
    if (profileUrl) {
      window.open(profileUrl, "_blank");
    } else {
      console.warn("No profile URL available for this provider");
    }
  };

  const closeMessageConfirmation = () => {
    setMessageConfirmation({
      show: false,
      providerName: "",
    });
  };

  // --------------------------------
  // 6. Render
  // --------------------------------
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Find Childcare Services</h1>

      {!isAuthenticated && !loading ? (
        <div className={styles.error}>
          <p>⚠️ {error || "Authentication required"}</p>
          <button className={styles.retryButton} onClick={handleLogin}>
            Log In
          </button>
        </div>
      ) : (
        <>
          {/* Search and Filter Panel */}
          <div className={styles.searchFilterPanel}>
            {/* Combined Search Input */}
            <div className={styles.combinedSearch}>
              <input
                type="text"
                placeholder="Search by city (e.g. Toronto, Vancouver), or by name (e.g. Sarah, John)"
                value={searchTerm}
                onChange={handleSearchChange}
                className={styles.combinedSearchInput}
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

            {/* Bottom Controls: Category Selection & Favorites */}
            <div className={styles.bottomControls}>
              {/* Category Selection with Purple Tint */}
              <div className={styles.categorySelector}>
                <button
                  className={`${styles.categoryButton} ${
                    category === "all" ? styles.active : ""
                  }`}
                  onClick={() => handleCategoryChange("all")}
                >
                  All
                </button>
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

              {/* Favorites Filter */}
              <div className={styles.favoritesFilterContainer}>
                <label className={styles.favoritesFilterLabel}>
                  <input
                    type="checkbox"
                    checked={showOnlyFavorites}
                    onChange={handleFavoritesFilterChange}
                    className={styles.favoritesCheckbox}
                  />
                  <span className={styles.favoritesHeart}>❤</span>
                  <span>Show only favorites</span>
                </label>
              </div>
            </div>
          </div>

          {/* Message Confirmation */}
          {messageConfirmation.show && (
            <div className={styles.messageConfirmationOverlay}>
              <div className={styles.messageConfirmation}>
                <div className={styles.checkmarkIcon}>✓</div>
                <p>Sent {messageConfirmation.providerName} a message to hire</p>
                <button
                  className={styles.confirmationButton}
                  onClick={closeMessageConfirmation}
                >
                  OK
                </button>
              </div>
            </div>
          )}

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
                  {currentProviders.map((provider) => {
                    const isFavorite = favoriteProviderIds.includes(
                      provider.id,
                    );
                    return (
                      <div
                        key={provider.id}
                        className={`${styles.providerCard} ${
                          provider.provider_type === "nannies"
                            ? styles.nanny
                            : styles.babysitter
                        } ${provider.is_premium ? styles.premium : ""}`}
                      >
                        {/* Favorite Button */}
                        <button
                          className={styles.favoriteButton}
                          onClick={() => handleToggleFavorite(provider.id)}
                          aria-label={
                            isFavorite
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className={`${styles.favoriteIcon} ${
                              isFavorite ? styles.active : ""
                            }`}
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </button>

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
                            {provider.location && <p>{provider.location}</p>}
                            {provider.rating && (
                              <div className={styles.starRating}>
                                <span className={styles.value}>
                                  {Number(provider.rating).toFixed(1)}
                                </span>
                                <span>⭐</span>
                              </div>
                            )}
                            <div className={styles.badgeContainer}>
                              {provider.verification && (
                                <span className={styles.verifiedBadge}>
                                  ✔ Verified
                                </span>
                              )}
                              {provider.is_premium && (
                                <span className={styles.premiumBadge}>
                                  Premium
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={styles.providerContent}>
                          {provider.title && (
                            <p className={styles.bio}>{provider.title}</p>
                          )}
                          {provider.experience && (
                            <p className={styles.experience}>
                              Experience: {provider.experience} years
                            </p>
                          )}
                          {provider.hourly_rate && (
                            <div className={styles.hourlyRate}>
                              ${Number(provider.hourly_rate).toFixed(2)}/hr
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className={styles.providerActions}>
                          <button
                            className={styles.viewProfileButton}
                            onClick={() =>
                              handleViewProfile(provider.profile_url)
                            }
                          >
                            View Profile
                          </button>

                          {/* 
                          <button
                            className={styles.contactButton}
                            onClick={() =>
                              handleSendMessage(provider.id, provider.name)
                            }
                          >
                            Contact
                          </button>
                          */}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  {showOnlyFavorites
                    ? "You haven't added any providers to your favorites yet."
                    : "No providers found matching your criteria. Try adjusting your filters."}
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
        </>
      )}
    </div>
  );
}

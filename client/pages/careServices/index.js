import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "./careServices.module.css";

const CareServices = () => {
  // -----------------------------
  // State
  // -----------------------------
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProvider, setExpandedProvider] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [category, setCategory] = useState("babysitters");

  // Cache-related
  const [cacheInfo, setCacheInfo] = useState({
    isCached: false,
    lastUpdated: null,
    fallback: false,
    requestedLocation: null,
    actualLocation: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [cityFilter, setCityFilter] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // The city actually displayed
  const [displayedLocation, setDisplayedLocation] = useState("");

  // Router
  const router = useRouter();

  // Available cities
  const [availableCities, setAvailableCities] = useState([]);

  // -----------------------------
  // Options
  // -----------------------------
  const availabilityOptions = [
    { id: "all", label: "Any Availability" },
    { id: "weekdays", label: "Weekdays" },
    { id: "weekends", label: "Weekends Only" },
    { id: "evenings", label: "Evenings" },
    { id: "overnight", label: "Overnight" },
  ];

  const sortOptions = [
    { id: "rating", label: "Top Rated" },
    { id: "price-low", label: "Lowest Price" },
    { id: "price-high", label: "Highest Price" },
    { id: "distance", label: "Nearest" },
  ];

  // -----------------------------
  // 1) Define fetch logic in a useRef
  // -----------------------------
  // We store a function in doFetchRef.current, so we can call it
  // from anywhere (effect, button handlers, etc.) without ESLint warnings.
  const doFetchRef = useRef(null);

  doFetchRef.current = async (forceRefresh = false, cityToUse = null) => {
    try {
      setLoading(true);
      if (forceRefresh) {
        setIsRefreshing(true);
      }

      // Reset fallback info
      setCacheInfo({
        isCached: false,
        lastUpdated: null,
        fallback: false,
        requestedLocation: null,
        actualLocation: null,
      });

      // Determine endpoint by category
      const endpoint =
        category === "babysitters"
          ? "careServices/babysitters"
          : "careServices/nannies";

      // Prepare query params
      const cityParam = cityToUse || cityFilter;
      let queryParams = new URLSearchParams();
      if (cityParam) {
        queryParams.append("location", cityParam);
      }
      if (forceRefresh) {
        queryParams.append("forceRefresh", "true");
      }
      const queryString = queryParams.toString();

      // Make API call
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/${endpoint}${
          queryString ? `?${queryString}` : ""
        }`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch ${category}`);
      }

      const data = await res.json();
      console.log("API Response:", data);

      if (data.status === "ok") {
        const responseData = data.data || data;
        const isCached = !!responseData.cached;
        const lastUpdated = responseData.lastUpdated || null;

        let providersArray = [];
        if (category === "babysitters") {
          providersArray = responseData.providers || [];
        } else {
          // nannies
          providersArray = responseData.nannies || responseData.providers || [];
        }

        // Process providers
        let enhancedProviders = [];
        if (providersArray && providersArray.length > 0) {
          enhancedProviders = processProviders(
            providersArray,
            category === "babysitters" ? "babysitter" : "nanny",
          );
        }

        // Collect all unique cities
        const allCities = [
          ...new Set(
            enhancedProviders
              .map((p) => p.location)
              .filter((loc) => loc && loc.trim().length > 0),
          ),
        ];
        setAvailableCities(allCities);

        // City filter logic
        const requestedCityValue = cityParam;
        const providersForCity = enhancedProviders.filter((p) =>
          providerMatchesCity(p, requestedCityValue),
        );

        // Check fallback
        const needsFallback =
          requestedCityValue &&
          providersForCity.length === 0 &&
          enhancedProviders.length > 0;

        if (needsFallback) {
          setDisplayedLocation("all available cities");
          if (cityToUse) {
            setSelectedCity("");
            setCityFilter("");
          }

          setCacheInfo({
            isCached,
            lastUpdated,
            fallback: true,
            requestedLocation: requestedCityValue,
            actualLocation: "all available cities",
          });
          setProviders(enhancedProviders);
        } else if (requestedCityValue) {
          setDisplayedLocation(requestedCityValue);
          if (cityToUse) {
            setSelectedCity(cityToUse);
            setCityFilter(cityToUse);
          }

          setCacheInfo({
            isCached,
            lastUpdated,
            fallback: false,
            requestedLocation: null,
            actualLocation: null,
          });
          setProviders(providersForCity);
        } else {
          setDisplayedLocation("all available cities");
          setCacheInfo({
            isCached,
            lastUpdated,
            fallback: false,
            requestedLocation: null,
            actualLocation: null,
          });
          setProviders(enhancedProviders);
        }
      } else {
        setError(`No ${category} found`);
      }
    } catch (err) {
      console.error(`Error fetching ${category}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // -----------------------------
  // 2) useEffect: Re-fetch on mount & whenever category changes
  // -----------------------------
  useEffect(() => {
    // Call doFetchRef.current here so we only depend on `category`.
    doFetchRef.current();
  }, [category]);

  // -----------------------------
  // Helpers
  // -----------------------------
  const processProviders = (rawProviders, providerCategory) => {
    return rawProviders.map((provider) => {
      const isPremium =
        provider.isPremium !== undefined
          ? provider.isPremium
          : providerCategory === "nanny" ||
            provider.verification ||
            provider.isLicensed;

      return {
        ...provider,
        isPremium,
        providerType: isPremium ? "business" : "individual",
        description: provider.bio || "",
        category: providerCategory,
        hourlyRate: provider.hourlyRate || 0,
        distance: provider.distance || 0,
        verified: Boolean(
          provider.verification || provider.isVerified || false,
        ),
        licensed: Boolean(provider.isLicensed || false),
        openings: provider.availability || "Contact for availability",
        availability: provider.availabilityDays || ["weekdays"],
        languages: provider.languages || ["English"],
        certifications: provider.certifications || [],
        specialties: provider.specialties || [],
        ageRange: provider.ageRangePreference || "All ages",
        hours: provider.workingHours || "Contact for details",
        contactInfo: {
          email: provider.email || "Contact through platform",
        },
      };
    });
  };

  const providerMatchesCity = (provider, city) => {
    if (!city) return true;
    if (!provider.location) return false;

    const provLoc = provider.location.toLowerCase();
    const filterLoc = city.toLowerCase();
    return provLoc.includes(filterLoc) || filterLoc.includes(provLoc);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
  };

  const handleForceRefresh = () => {
    doFetchRef.current(true);
  };

  const toggleExpandProvider = (id) => {
    setExpandedProvider(expandedProvider === id ? null : id);
  };

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(
      favorites.includes(id)
        ? favorites.filter((favId) => favId !== id)
        : [...favorites, id],
    );
  };

  const handleCityFilterChange = (e) => {
    setCityFilter(e.target.value);
  };

  const handleApplyFilterClick = () => {
    doFetchRef.current(false, cityFilter);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCityFilter("");
    setSelectedCity("");
    setAvailabilityFilter("all");
    setSortBy("rating");
    doFetchRef.current();
  };

  // -----------------------------
  // Filtering & sorting
  // -----------------------------
  const filteredProviders = providers
    .filter((p) => {
      if (
        searchTerm &&
        !p.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (
        availabilityFilter !== "all" &&
        (!p.availability || !p.availability.includes(availabilityFilter))
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.hourlyRate || 0) - (b.hourlyRate || 0);
        case "price-high":
          return (b.hourlyRate || 0) - (a.hourlyRate || 0);
        case "distance":
          return (a.distance || 0) - (b.distance || 0);
        case "rating":
        default:
          return (b.rating || 0) - (a.rating || 0);
      }
    });

  // -----------------------------
  // Stars
  // -----------------------------
  const renderStars = (rating) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className={styles.stars}>
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`${styles.star} ${
              i < fullStars || (i === fullStars && hasHalfStar)
                ? styles.starFilled
                : styles.starEmpty
            }`}
          >
            {i < fullStars || (i === fullStars && hasHalfStar) ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Find Childcare Services</h1>

      {/* Category Selection */}
      <div className={styles.categorySelector}>
        <button
          className={`${styles.categoryButton} ${
            category === "babysitters" ? styles.categoryActive : ""
          }`}
          onClick={() => handleCategoryChange("babysitters")}
        >
          Babysitters
        </button>
        <button
          className={`${styles.categoryButton} ${
            category === "nannies" ? styles.categoryActive : ""
          }`}
          onClick={() => handleCategoryChange("nannies")}
        >
          Nannies
        </button>
      </div>

      {/* Cache status indicator */}
      {!loading && cacheInfo.isCached && (
        <div className={styles.cacheInfo}>
          <div className={styles.cacheStatusBadge}>
            <span role="img" aria-label="Cache">
              ⚡
            </span>{" "}
            Cached Data
          </div>
          {cacheInfo.lastUpdated && (
            <div className={styles.cacheTimestamp}>
              Last updated: {formatDate(cacheInfo.lastUpdated)}
            </div>
          )}
          {cacheInfo.fallback && cacheInfo.requestedLocation && (
            <div className={styles.cacheFallback}>
              No data available for &quot;{cacheInfo.requestedLocation}&quot;.
              Showing results from {cacheInfo.actualLocation} instead.
            </div>
          )}
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className={styles.refreshButton}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      )}

      {/* Search bar with filter button */}
      <div className={styles.searchContainer}>
        <span className={styles.searchIcon}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={`Search ${category}...`}
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <button
          onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          className={styles.filterButton}
          aria-label="Toggle filters"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
          Filters
        </button>
      </div>

      {/* City filter section */}
      <div className={styles.searchContainer}>
        <span className={styles.searchIcon}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </span>
        <input
          type="text"
          placeholder="Filter by city..."
          value={cityFilter}
          onChange={handleCityFilterChange}
          className={styles.searchInput}
        />
        <button
          onClick={handleApplyFilterClick}
          className={styles.applyFilterButton}
        >
          Apply
        </button>
      </div>

      {availableCities.length > 0 && (
        <div className={styles.citySuggestions}>
          <h3 className={styles.suggestionsTitle}>Available Cities:</h3>
          <div className={styles.cityTags}>
            {availableCities.map((city) => (
              <button
                key={city}
                onClick={() => doFetchRef.current(false, city)}
                className={`${styles.cityTag} ${
                  selectedCity.toLowerCase() === city.toLowerCase()
                    ? styles.cityTagActive
                    : ""
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters panel */}
      {isFiltersVisible && (
        <div className={`${styles.filtersContainer} ${styles.visible}`}>
          <div className={styles.filterSection}>
            {/* Availability filter */}
            <p className={styles.filterTitle}>Availability</p>
            <div className={styles.filterOptions}>
              {availabilityOptions.map((option) => (
                <button
                  key={option.id}
                  className={`${styles.filterOption} ${
                    availabilityFilter === option.id
                      ? styles.filterOptionActive
                      : ""
                  }`}
                  onClick={() => setAvailabilityFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Sort options */}
            <p className={styles.filterTitle}>Sort By</p>
            <div className={styles.filterOptions}>
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  className={`${styles.filterOption} ${
                    sortBy === option.id ? styles.filterOptionActive : ""
                  }`}
                  onClick={() => setSortBy(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Clear filters button */}
            <div className={styles.clearFilters}>
              <button
                className={styles.clearFiltersButton}
                onClick={clearFilters}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading / Error / Results */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinnerWrapper}>
            <div className={styles.spinner}></div>
          </div>
          <p>Loading {category}...</p>
        </div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          <p className={styles.resultCount}>
            Showing {filteredProviders.length}{" "}
            {filteredProviders.length === 1
              ? category === "babysitters"
                ? "babysitter"
                : "nanny"
              : category}
            {selectedCity
              ? ` in ${selectedCity}`
              : filteredProviders.length > 0
              ? " from all available cities"
              : ""}
          </p>

          <div className={styles.providersGrid}>
            {filteredProviders.length > 0 ? (
              filteredProviders.map((provider, index) => {
                // If the backend returns a localhost-based profile URL, fix it:
                const sanitizedProfileUrl = provider.profileUrl?.includes(
                  "localhost",
                )
                  ? provider.profileUrl.replace(
                      "http://localhost:3000",
                      "https://care.com",
                    )
                  : provider.profileUrl;

                return (
                  <div
                    key={provider.id || index}
                    className={styles.providerCard}
                  >
                    {/* Provider type banner */}
                    <div
                      className={`${styles.providerTypeBanner} ${
                        provider.providerType === "individual"
                          ? styles.individualProvider
                          : styles.businessProvider
                      }`}
                    >
                      {provider.providerType === "individual"
                        ? `Individual ${
                            provider.category === "babysitter"
                              ? "Babysitter"
                              : "Nanny"
                          }`
                        : `Professional ${
                            provider.category === "babysitter"
                              ? "Babysitter"
                              : "Nanny"
                          }`}
                    </div>

                    {/* Premium badge */}
                    {provider.isPremium && (
                      <div className={styles.premiumBadge}>Premium</div>
                    )}

                    <div
                      className={styles.cardContent}
                      onClick={() => toggleExpandProvider(provider.id || index)}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.imageContainer}>
                          {provider.profileImage ? (
                            <Image
                              src={provider.profileImage}
                              alt={provider.name || "Profile Image"}
                              className={styles.providerImage}
                              width={80}
                              height={80}
                            />
                          ) : (
                            <div className={styles.placeholderImage}>
                              {provider.name?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>

                        <div className={styles.headerInfo}>
                          <h2 className={styles.providerName}>
                            {provider.name}
                          </h2>
                          <p className={styles.providerLocation}>
                            <span className={styles.locationIcon}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                            </span>
                            {provider.location}
                            {provider.distance > 0 &&
                              ` (${provider.distance} km)`}
                          </p>

                          {provider.rating && (
                            <div className={styles.ratingContainer}>
                              {renderStars(provider.rating)}
                              <span className={styles.ratingText}>
                                {provider.rating}
                              </span>
                              {provider.reviewsCount > 0 && (
                                <span className={styles.reviewCount}>
                                  ({provider.reviewsCount})
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Favorite button */}
                        <button
                          className={`${styles.favoriteButton} ${
                            favorites.includes(provider.id || index)
                              ? styles.favoriteActive
                              : ""
                          }`}
                          onClick={(e) =>
                            toggleFavorite(provider.id || index, e)
                          }
                          aria-label={
                            favorites.includes(provider.id || index)
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                        >
                          {favorites.includes(provider.id || index) ? "♥" : "♡"}
                        </button>
                      </div>

                      <div className={styles.infoContent}>
                        {provider.hourlyRate > 0 && (
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>
                              Hourly Rate:
                            </span>
                            <span className={styles.rateValue}>
                              ${provider.hourlyRate.toFixed(2)}
                            </span>
                          </div>
                        )}

                        {provider.experience && (
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>
                              Experience:
                            </span>
                            <span>{provider.experience}</span>
                          </div>
                        )}

                        {provider.age && (
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Age:</span>
                            <span>{provider.age}</span>
                          </div>
                        )}

                        {provider.bio && (
                          <p className={styles.bio}>
                            {provider.bio.length > 150
                              ? `${provider.bio.substring(0, 150)}...`
                              : provider.bio}
                          </p>
                        )}
                      </div>

                      {/* Badges */}
                      <div className={styles.badgesContainer}>
                        {provider.licensed && (
                          <span
                            className={`${styles.badge} ${styles.licensedBadge}`}
                          >
                            <span className={styles.badgeIcon}>✓</span> Licensed
                          </span>
                        )}
                        {provider.verified && (
                          <span
                            className={`${styles.badge} ${styles.verifiedBadge}`}
                          >
                            <span className={styles.badgeIcon}>✓</span> Verified
                          </span>
                        )}
                        {provider.hiredCount > 0 && (
                          <span
                            className={`${styles.badge} ${styles.hiredBadge}`}
                          >
                            <span className={styles.badgeIcon}>👍</span>
                            Hired {provider.hiredCount}{" "}
                            {provider.hiredCount === 1 ? "time" : "times"}
                          </span>
                        )}
                      </div>

                      {/* Price and availability */}
                      <div className={styles.pricingContainer}>
                        <div className={styles.openings}>
                          {provider.openings}
                        </div>
                        {provider.hourlyRate > 0 && (
                          <div className={styles.hourlyRate}>
                            ${provider.hourlyRate.toFixed(2)}
                            <span className={styles.rateUnit}>/hr</span>
                          </div>
                        )}
                      </div>

                      {/* View more button */}
                      <div className={styles.viewMoreContainer}>
                        <button className={styles.viewMoreButton}>
                          {expandedProvider === (provider.id || index)
                            ? "View less"
                            : "View more"}
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {expandedProvider === (provider.id || index) && (
                      <div className={styles.expandedDetails}>
                        <div className={styles.detailsGrid}>
                          <div>
                            {provider.age && (
                              <div className={styles.detailSection}>
                                <p className={styles.detailLabel}>Age</p>
                                <p className={styles.detailValue}>
                                  {provider.age} years
                                </p>
                              </div>
                            )}

                            {provider.ageRange && (
                              <div className={styles.detailSection}>
                                <p className={styles.detailLabel}>
                                  Age Range Preference
                                </p>
                                <p className={styles.detailValue}>
                                  {provider.ageRange}
                                </p>
                              </div>
                            )}

                            {provider.hours && (
                              <div className={styles.detailSection}>
                                <p className={styles.detailLabel}>Hours</p>
                                <p className={styles.detailValue}>
                                  {provider.hours}
                                </p>
                              </div>
                            )}

                            {provider.languages &&
                              provider.languages.length > 0 && (
                                <div className={styles.detailSection}>
                                  <p className={styles.detailLabel}>
                                    Languages
                                  </p>
                                  <div className={styles.chipContainer}>
                                    {provider.languages.map((lang, idx) => (
                                      <span key={idx} className={styles.chip}>
                                        {lang}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {provider.featuredReview && (
                              <div className={styles.detailSection}>
                                <p className={styles.detailLabel}>Review</p>
                                <p className={styles.detailValue}>
                                  &quot;{provider.featuredReview}&quot;
                                </p>
                              </div>
                            )}
                          </div>

                          <div>
                            {provider.certifications &&
                              provider.certifications.length > 0 && (
                                <div className={styles.detailSection}>
                                  <p className={styles.detailLabel}>
                                    Certifications
                                  </p>
                                  <div className={styles.chipContainer}>
                                    {provider.certifications.map(
                                      (cert, idx) => (
                                        <span
                                          key={idx}
                                          className={`${styles.chip} ${styles.licensedBadge}`}
                                        >
                                          <span className={styles.badgeIcon}>
                                            ✓
                                          </span>{" "}
                                          {cert}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {provider.specialties &&
                              provider.specialties.length > 0 && (
                                <div className={styles.detailSection}>
                                  <p className={styles.detailLabel}>
                                    Specialties
                                  </p>
                                  <div className={styles.chipContainer}>
                                    {provider.specialties.map(
                                      (specialty, idx) => (
                                        <span key={idx} className={styles.chip}>
                                          {specialty}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Contact Info */}
                            {provider.contactInfo && (
                              <div className={styles.detailSection}>
                                <p className={styles.detailLabel}>Contact</p>
                                {provider.contactInfo.phone && (
                                  <p className={styles.detailValue}>
                                    {provider.contactInfo.phone}
                                  </p>
                                )}
                                {provider.contactInfo.email && (
                                  <p className={styles.detailValue}>
                                    {provider.contactInfo.email}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={styles.actionsContainer}>
                          {/* Profile link (with sanitized URL) */}
                          {provider.profileUrl && (
                            <a
                              href={sanitizedProfileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${styles.actionButton} ${styles.primaryButton}`}
                            >
                              View Full Profile
                            </a>
                          )}
                          <button
                            className={`${styles.actionButton} ${styles.secondaryButton}`}
                          >
                            <span className={styles.buttonIcon}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                              </svg>
                            </span>
                            Contact {provider.name.split(" ")[0]}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className={styles.noResults}>
                <p>
                  No {category} found {selectedCity ? `in ${selectedCity}` : ""}
                  .
                </p>
                <button
                  onClick={clearFilters}
                  className={styles.viewProfileButton}
                  style={{ marginTop: "16px" }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CareServices;

const Listing = require("../models/listing.js");


module.exports.index = async (req, res, next) => {
  let listing = await Listing.find(); //get all listings
  let { q, category } = req.query;

  // let category = req.query.category;
  // let filterListing = await Listing.find({ category: `${category}` });

  let searchListing = [];
  let filterListing = [];
  let noResults = "";

  if (q) {
    let searchListingByTitle = await Listing.find({
      title: { $regex: `${q}`, $options: "i" },
    });
    let searchListingByCountry = await Listing.find({
      country: { $regex: `${q}`, $options: "i" },
    });
    let searchListingByLocation = await Listing.find({
      location: { $regex: `${q}`, $options: "i" },
    });

    // if(searchListingByCountry.length === 0) {
    //   searchListing = searchListingByTitle;
    // } else if (searchListingByTitle.length === 0) {
    //   searchListing = searchListingByCountry
    // } else {
    //   searchListing = "No Such Villas Available";
    // }

    if (
      searchListingByTitle.length === 0 &&
      searchListingByCountry.length === 0 &&
      searchListingByLocation === 0
    ) {
      noResults = "More filters are yet to come...";
    } else {
      searchListing = [
        ...searchListingByTitle,
        ...searchListingByCountry,
        ...searchListingByLocation,
      ]; //ths will merge the result
    }
    // res.render("listing/index.ejs", {searchListing, q, category})
  }

  console.log(searchListing);
  

  if (category) {
    filterListing = listing.filter(
      (listings) => listings.category === category
    );
    if (filterListing.length === 0) {
      noResults = "More filters are yet to come...";
    }
  }

  res.render("listing/index.ejs", {
    listing:
      searchListing.length > 0
        ? searchListing
        : category
        ? filterListing
        : listing,
    filterListing,
    category,
    noResults,
    q,
  });
};

module.exports.new = (req, res) => {
  res.render("listing/new.ejs");
};

module.exports.show = async (req, res, next) => {
  let { id } = req.params;
  const listings = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listings) {
    req.flash("error", "Filter you have requested for does not exist");
    res.redirect("/listings");
  }
  res.render("listing/show.ejs", { listings });
};

module.exports.create = async (req, res, next) => {
 

  let url = req.file.path;
  let filename = req.file.filename;

  // let { title, description, price, location, country } = req.body;
  let listing = req.body.listing;

  listing.owner = req.user._id;

};

module.exports.edit = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id).populate("owner");
  if (!listing) {
    req.flash("error", "Filter you have requested for does not Exist");
    res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_200,w_300");

  res.render("listing/edit.ejs", { listing, originalImageUrl });
};

module.exports.update = async (req, res, next) => {
  if (!req.body.listing) {
    throw new Error(400, "Bad Request!!");
  }
  let { id } = req.params;

  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  listing.geometry = response.body.features[0].geometry;
  await listing.save();

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  res.redirect(`/listings/${id}`);
};

module.exports.destroy = async (req, res, next) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("delete", "Filter Deleted!!");
  res.redirect("/listings");
};

// module.exports.trending = async (req, res, next) => {
//   let category = req.query.category;
//   console.log(category);
//   let listing = await Listing.find({ category: `${category}` });
//   res.render("listing/filter.ejs", { listing, category });
// };

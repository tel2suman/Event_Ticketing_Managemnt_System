const mongoose = require("mongoose");

const cloudinary = require("../../config/cloudinary");
const blogModel = require("../../models/blog");
const HttpStatusCode = require("../../utils/httpStatusCode");

const {
  createBlogValidation,
  updateBlogValidation,
} = require("../../validations/blogValidation");
const Category = require("../../models/Category");

class BlogController {
  // CREATE BLOG

  // async createBlog(req, res) {
  //   try {
  //     const { error, value } = createBlogValidation.validate(req.body);

  //     if (error) {
  //       return res.status(HttpStatusCode.BAD_REQUEST).json({
  //         success: false,
  //         message: error.details[0].message,
  //       });
  //     }

  //     const {
  //       title,
  //       excerpt,
  //       content,
  //       category,
  //       tags,
  //       author,
  //       status,
  //       publishDate,
  //       slug,
  //       metaTitle,
  //       metaDescription,
  //     } = value;

  //     // Check duplicate title
  //     const existingTitle = await blogModel.findOne({
  //       title,
  //       isDeleted: false,
  //     });

  //     if (existingTitle) {
  //       return res.status(HttpStatusCode.CONFLICT).json({
  //         success: false,
  //         message: "Blog title already exists.",
  //       });
  //     }

  //     // Check duplicate slug
  //     const existingSlug = await blogModel.findOne({
  //       slug,
  //       isDeleted: false,
  //     });

  //     if (existingSlug) {
  //       return res.status(HttpStatusCode.CONFLICT).json({
  //         success: false,
  //         message: "Blog slug already exists.",
  //       });
  //     }

  //     // Validate category ObjectId
  //     if (!mongoose.Types.ObjectId.isValid(category)) {
  //       return res.status(HttpStatusCode.BAD_REQUEST).json({
  //         success: false,
  //         message: "Invalid category ID.",
  //       });
  //     }

  //     // Check category exists and is active
  //     const categoryExists = await Category.findOne({
  //       _id: category,
  //       isActive: true,
  //     });

  //     if (!categoryExists) {
  //       return res.status(HttpStatusCode.NOT_FOUND).json({
  //         success: false,
  //         message: "Category not found or inactive.",
  //       });
  //     }

  //     // Scheduled blog must have publish date
  //     if (status === "Scheduled" && !publishDate) {
  //       return res.status(HttpStatusCode.BAD_REQUEST).json({
  //         success: false,
  //         message: "Publish date is required for scheduled blog.",
  //       });
  //     }

  //     // Scheduled date must be in future
  //     if (status === "Scheduled" && publishDate) {
  //       if (new Date(publishDate) <= new Date()) {
  //         return res.status(HttpStatusCode.BAD_REQUEST).json({
  //           success: false,
  //           message: "Scheduled publish date must be in the future.",
  //         });
  //       }
  //     }

  //     // Published blog gets current date
  //     let finalPublishDate = publishDate;

  //     if (status === "Published" && !finalPublishDate) {
  //       finalPublishDate = new Date();
  //     }

  //     const blog = new blogModel({
  //       title,
  //       excerpt,
  //       content,
  //       category,
  //       tags: tags || [],
  //       author,
  //       status: status || "Draft",
  //       publishDate: finalPublishDate,
  //       slug,
  //       metaTitle,
  //       metaDescription,
  //     });

  //     // Featured image
  //     if (req.file) {
  //       blog.featuredImage = {
  //         url: req.file.path,
  //         public_id: req.file.filename,
  //       };
  //     }

  //     await blog.save();

  //     // Fetch newly created blog using aggregation + lookup
  //     const createdBlog = await blogModel.aggregate([
  //       {
  //         $match: {
  //           _id: blog._id,
  //           isDeleted: false,
  //         },
  //       },

  //       {
  //         $lookup: {
  //           from: "categories",
  //           localField: "category",
  //           foreignField: "_id",
  //           as: "category",
  //         },
  //       },

  //       {
  //         $unwind: {
  //           path: "$category",
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },
  //     ]);

  //     return res.status(HttpStatusCode.CREATED).json({
  //       success: true,
  //       message: "Blog created successfully.",
  //       data: createdBlog[0],
  //     });
  //   } catch (error) {
  //     return res.status(HttpStatusCode.SERVER_ERROR).json({
  //       success: false,
  //       message: error.message,
  //     });
  //   }
  // }

  async createBlog(req, res) {
    try {
      const {
        title,
        excerpt,
        content,
        category,
        tags,
        author,
        status,
        publishDate,
        slug,
        metaTitle,
        metaDescription,
      } = req.body;

      // Check duplicate title
      const existingTitle = await blogModel.findOne({
        title,
        isDeleted: false,
      });

      if (existingTitle) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "Blog title already exists.",
        });
      }

      // Check duplicate slug
      const existingSlug = await blogModel.findOne({
        slug,
        isDeleted: false,
      });

      if (existingSlug) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "Blog slug already exists.",
        });
      }

      // Validate category ObjectId
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid category ID.",
        });
      }

      // Check category exists and is active
      const categoryExists = await Category.findOne({
        _id: category,
        isActive: true,
      });

      if (!categoryExists) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Category not found or inactive.",
        });
      }

      // Scheduled blog must have publish date
      if (status === "Scheduled" && !publishDate) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Publish date is required for scheduled blog.",
        });
      }

      // Scheduled date must be in future
      if (status === "Scheduled" && publishDate) {
        if (new Date(publishDate) <= new Date()) {
          return res.status(HttpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "Scheduled publish date must be in the future.",
          });
        }
      }

      // Published blog gets current date
      let finalPublishDate = publishDate;

      if (status === "Published" && !finalPublishDate) {
        finalPublishDate = new Date();
      }

      const blog = new blogModel({
        title,
        excerpt,
        content,
        category,
        tags: tags || [],
        author,
        status: status || "Draft",
        publishDate: finalPublishDate,
        slug,
        metaTitle,
        metaDescription,
      });

      // Featured image
      if (req.file) {
        blog.featuredImage = {
          url: req.file.path,
          public_id: req.file.filename,
        };
      }

      await blog.save();

      const createdBlog = await blogModel.aggregate([
        {
          $match: {
            _id: blog._id,
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Blog created successfully.",
        data: createdBlog[0],
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET ALL BLOGS

  async getBlogs(req, res) {
    try {
      const blogs = await blogModel.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $sort: {
            createdAt: -1,
          },
        },

        {
          $project: {
            title: 1,
            excerpt: 1,
            content: 1,
            tags: 1,
            author: 1,
            status: 1,
            publishDate: 1,
            featuredImage: 1,
            slug: 1,
            metaTitle: 1,
            metaDescription: 1,
            isDeleted: 1,
            createdAt: 1,
            updatedAt: 1,

            category: {
              _id: "$category._id",
              categoryName: "$category.categoryName",
            },
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: blogs.length,
        data: blogs,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET PUBLISHED BLOGS

  async getPublishedBlogs(req, res) {
    try {
      const blogs = await blogModel.aggregate([
        {
          $match: {
            status: "Published",
            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $sort: {
            publishDate: -1,
          },
        },

        {
          $project: {
            title: 1,
            excerpt: 1,
            content: 1,
            tags: 1,
            author: 1,
            status: 1,
            publishDate: 1,
            featuredImage: 1,
            slug: 1,
            metaTitle: 1,
            metaDescription: 1,
            createdAt: 1,
            updatedAt: 1,

            category: {
              _id: "$category._id",
              categoryName: "$category.categoryName",
            },
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: blogs.length,
        data: blogs,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET BLOG BY ID

  async getBlogById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid blog ID.",
        });
      }

      const blogs = await blogModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            title: 1,
            excerpt: 1,
            content: 1,
            tags: 1,
            author: 1,
            status: 1,
            publishDate: 1,
            featuredImage: 1,
            slug: 1,
            metaTitle: 1,
            metaDescription: 1,
            isDeleted: 1,
            createdAt: 1,
            updatedAt: 1,

            category: {
              _id: "$category._id",
              categoryName: "$category.categoryName",
            },
          },
        },
      ]);

      if (!blogs.length) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found.",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: blogs[0],
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET BLOG BY SLUG

  async getBlogBySlug(req, res) {
    try {
      const { slug } = req.params;

      if (!slug) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Blog slug is required.",
        });
      }

      const blogs = await blogModel.aggregate([
        {
          $match: {
            slug: slug.toLowerCase(),
            status: "Published",
            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      if (!blogs.length) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found.",
        });
      }

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: blogs[0],
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // UPDATE BLOG

  async updateBlog(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid blog ID.",
        });
      }

      const { error, value } = updateBlogValidation.validate(req.body);

      if (error) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const blog = await blogModel.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!blog) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found.",
        });
      }

      const {
        title,
        excerpt,
        content,
        category,
        tags,
        author,
        status,
        publishDate,
        slug,
        metaTitle,
        metaDescription,
      } = value;

      // Duplicate title
      if (title) {
        const existingTitle = await blogModel.findOne({
          title,
          _id: { $ne: id },
          isDeleted: false,
        });

        if (existingTitle) {
          return res.status(HttpStatusCode.CONFLICT).json({
            success: false,
            message: "Blog title already exists.",
          });
        }
      }

      // Duplicate slug
      if (slug) {
        const existingSlug = await blogModel.findOne({
          slug,
          _id: { $ne: id },
          isDeleted: false,
        });

        if (existingSlug) {
          return res.status(HttpStatusCode.CONFLICT).json({
            success: false,
            message: "Blog slug already exists.",
          });
        }
      }

      // Validate category if being updated
      if (category) {
        if (!mongoose.Types.ObjectId.isValid(category)) {
          return res.status(HttpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "Invalid category ID.",
          });
        }

        const categoryExists = await categoryModel.findOne({
          _id: category,
          isActive: true,
        });

        if (!categoryExists) {
          return res.status(HttpStatusCode.NOT_FOUND).json({
            success: false,
            message: "Category not found or inactive.",
          });
        }
      }

      // Scheduled validation
      if (status === "Scheduled") {
        const finalDate = publishDate || blog.publishDate;

        if (!finalDate) {
          return res.status(HttpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "Publish date is required for scheduled blog.",
          });
        }

        if (new Date(finalDate) <= new Date()) {
          return res.status(HttpStatusCode.BAD_REQUEST).json({
            success: false,
            message: "Scheduled publish date must be in the future.",
          });
        }
      }

      const updateObj = {
        ...value,
      };

      // Upload new featured image
      if (req.file) {
        if (blog.featuredImage?.public_id) {
          await cloudinary.uploader.destroy(blog.featuredImage.public_id);
        }

        updateObj.featuredImage = {
          url: req.file.path,
          public_id: req.file.filename,
        };
      }

      const updatedBlog = await blogModel.findByIdAndUpdate(id, updateObj, {
        new: true,
        runValidators: true,
      });

      // Get updated blog with category using aggregation
      const result = await blogModel.aggregate([
        {
          $match: {
            _id: updatedBlog._id,
            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Blog updated successfully.",
        data: result[0],
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUBLISH BLOG

  async publishBlog(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid blog ID.",
        });
      }

      const blog = await blogModel.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!blog) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found.",
        });
      }

      blog.status = "Published";
      blog.publishDate = new Date();

      await blog.save();

      // Aggregation + lookup
      const result = await blogModel.aggregate([
        {
          $match: {
            _id: blog._id,
            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Blog published successfully.",
        data: result[0],
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // SCHEDULE BLOG

  async scheduleBlog(req, res) {
    try {
      const { id } = req.params;
      const { publishDate } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid blog ID.",
        });
      }

      if (!publishDate) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Publish date is required.",
        });
      }

      const date = new Date(publishDate);

      if (isNaN(date.getTime())) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid publish date.",
        });
      }

      if (date <= new Date()) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Publish date must be in the future.",
        });
      }

      const blog = await blogModel.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!blog) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found.",
        });
      }

      blog.status = "Scheduled";
      blog.publishDate = date;

      await blog.save();

      const result = await blogModel.aggregate([
        {
          $match: {
            _id: blog._id,
            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Blog scheduled successfully.",
        data: result[0],
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // SAVE AS DRAFT

  async saveAsDraft(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid blog ID.",
        });
      }

      const blog = await blogModel.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!blog) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found.",
        });
      }

      blog.status = "Draft";
      blog.publishDate = null;

      await blog.save();

      const result = await blogModel.aggregate([
        {
          $match: {
            _id: blog._id,
            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Blog saved as draft successfully.",
        data: result[0],
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // SOFT DELETE

  async deleteBlog(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid blog ID.",
        });
      }

      const blog = await blogModel.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!blog) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found.",
        });
      }

      blog.isDeleted = true;

      await blog.save();

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Blog moved to trash successfully.",
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET TRASH BLOGS

  async trashBlogs(req, res) {
    try {
      const blogs = await blogModel.aggregate([
        {
          $match: {
            isDeleted: true,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $sort: {
            updatedAt: -1,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        count: blogs.length,
        data: blogs,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // RESTORE BLOG

  async restoreBlog(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid blog ID.",
        });
      }

      const blog = await blogModel.findOne({
        _id: id,
        isDeleted: true,
      });

      if (!blog) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found in trash.",
        });
      }

      blog.isDeleted = false;

      await blog.save();

      const result = await blogModel.aggregate([
        {
          $match: {
            _id: blog._id,
            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Blog restored successfully.",
        data: result[0],
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PERMANENT DELETE

  async permanentDelete(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid blog ID.",
        });
      }

      const blog = await blogModel.findById(id);

      if (!blog) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found.",
        });
      }

      // Delete Cloudinary image
      if (blog.featuredImage?.public_id) {
        await cloudinary.uploader.destroy(blog.featuredImage.public_id);
      }

      await blogModel.findByIdAndDelete(id);

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Blog deleted permanently.",
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new BlogController();

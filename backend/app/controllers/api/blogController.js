const cloudinary = require("../../config/cloudinary");
const blogModel = require("../../models/blog");
const HttpStatusCode = require("../../utils/httpStatusCode");
const {
  createBlogValidation,
  updateBlogValidation,
} = require("../../validations/blogValidation");

class BlogController {
  // Create Blog

  async createBlog(req, res) {
    try {
      const { error, value } = createBlogValidation.validate(req.body);

      if (error) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const existingBlog = await blogModel.findOne({
        title: value.title,
        isDeleted: false,
      });

      if (existingBlog) {
        return res.status(HttpStatusCode.CONFLICT).json({
          success: false,
          message: "Blog title already exists.",
        });
      }

      const blog = new blogModel({
        title: value.title,
        excerpt: value.excerpt,
        content: value.content,
        category: value.category,
        status: value.status,
        publishDate: value.publishDate,
      });

      if (req.file) {
        blog.featuredImage = {
          url: req.file.path,
          public_id: req.file.filename,
        };
      }
      await blog.save();

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Blog created successfully.",
        data: blog,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get All Blogs

  async getBlogs(req, res) {
    try {
      const blogs = await blogModel.find({
        isDeleted: false,
      });

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
  // Get Published Blogs

  async getPublishedBlogs(req, res) {
    try {
      const blogs = await blogModel
        .find({
          status: "Published",
          isDeleted: false,
        })
        .sort({
          publishDate: -1,
        });

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

  // Get Single Blog

  async getBlogById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Blog id is required.",
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

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        data: blog,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update Blog

  async updateBlog(req, res) {
    try {
      const { id } = req.params;

      const { error } = updateBlogValidation.validate(req.body);

      if (error) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const updateData = await blogModel.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!updateData) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found.",
        });
      }
      if (req.body.title) {
        const existingBlog = await blogModel.findOne({
          title: req.body.title,
          _id: { $ne: id },
          isDeleted: false,
        });

        if (existingBlog) {
          return res.status(HttpStatusCode.CONFLICT).json({
            success: false,
            message: "Blog title already exists.",
          });
        }
      }
      let updateObj = { ...req.body };

      if (req.file) {
        if (updateData.featuredImage.public_id) {
          await cloudinary.uploader.destroy(updateData.featuredImage.public_id);
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

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Blog updated successfully.",
        data: updatedBlog,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Publish Blog

  async publishBlog(req, res) {
    try {
      const { id } = req.params;

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

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Blog published successfully.",
        data: blog,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Scheduled Blog

  async scheduleBlog(req, res) {
    try {
      const { id } = req.params;
      const { publishDate } = req.body;

      if (!publishDate) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Publish date is required.",
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
      blog.publishDate = publishDate;

      await blog.save();

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Blog scheduled successfully.",
        data: blog,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Draft Blog

  async saveAsDraft(req, res) {
    try {
      const { id } = req.params;

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

      await blog.save();

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Blog saved as draft successfully.",
        data: blog,
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Soft Delete

  async deleteBlog(req, res) {
    try {
      const { id } = req.params;

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

      await blogModel.findByIdAndUpdate(
        id,
        {
          isDeleted: true,
        },
        {
          new: true,
        },
      );

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

  // Trash Blogs

  async trashBlogs(req, res) {
    try {
      const blogs = await blogModel.find({
        isDeleted: true,
      });

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

  // Restore Blog

  async restoreBlog(req, res) {
    try {
      const { id } = req.params;

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

      await blogModel.findByIdAndUpdate(
        id,
        {
          isDeleted: false,
        },
        {
          new: true,
        },
      );

      return res.status(HttpStatusCode.SUCCESS).json({
        success: true,
        message: "Blog restored successfully.",
      });
    } catch (error) {
      return res.status(HttpStatusCode.SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Permanent Delete

  async permanentDelete(req, res) {
    try {
      const { id } = req.params;

      const blog = await blogModel.findById(id);

      if (!blog) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Blog not found.",
        });
      }

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

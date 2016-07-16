<?php

namespace App\Http\Controllers;

use App\Gallery;
use App\Http\Requests\GalleryRequest;
use App\Http\Requests\ImageRequest;
use App\Image;
use Illuminate\Http\Request;

use App\Http\Requests;

class GalleriesController extends DashboardController
{
    public function __construct()
    {
        $this->middleware('dashboard', ['except' => 'view']);
    }

    public function index()
    {
        $galleries = Gallery::paginate();

        return view('dashboard.gallery.index', compact('galleries'));
    }

    public function create()
    {
        return view('dashboard.gallery.create');
    }

    public function store(GalleryRequest $request)
    {
        $gallery = Gallery::create($request->all());

        return redirect()->route('upload_gallery', $gallery->id);
    }

    public function edit(Gallery $gallery)
    {
        return view('dashboard.gallery.edit', compact('gallery'));
    }

    public function update(Gallery $gallery, GalleryRequest $request)
    {
        $gallery->update($request->all());

        return redirect()->route('gallery');
    }

    public function destroy(Gallery $gallery)
    {
        $gallery->delete();

        return redirect()->route('gallery');
    }

    public function upload(Gallery $gallery)
    {
        return view('dashboard.gallery.upload', compact('gallery'));
    }

    public function uploadImage(ImageRequest $request, Gallery $gallery)
    {
        $image = Image::fromFile($request->file('image'));

        $gallery->addImage($image);
    }

    public function view(Gallery $gallery)
    {
        return view('dashboard.gallery.view', compact('gallery'));
    }

    public function sorting(Gallery $gallery)
    {
        return view('dashboard.gallery.sorting', compact('gallery'));
    }

    public function postSorting(Gallery $gallery, Request $request)
    {
        return (int)$gallery->sorting($request->input('images'));
    }

    public function deleteImage(Image $image)
    {
        $image->delete();
        return redirect()->back();
    }
}

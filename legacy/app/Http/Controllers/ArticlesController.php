<?php

namespace App\Http\Controllers;

use App\Article;
use App\Http\Requests\ArticleRequest;
use Illuminate\Http\Request;
use File;
use App\Http\Requests;

class ArticlesController extends DashboardController
{
    protected static $previewPath = 'images/preview';

    public function index()
    {
        $articles = Article::paginate(5);

        return view('dashboard.article.index', compact('articles'));
    }


    public function create()
    {
        return view('dashboard.article.create');
    }


    public function store(ArticleRequest $request)
    {
        Article::create($request->all());

        return redirect()->route('all_articles');
    }


    public function show(Article $article)
    {
        return view('dashboard.article.show', compact('article'));
    }


    public function edit(Article $article)
    {
        return view('dashboard.article.edit', compact('article'));
    }


    public function update(ArticleRequest $request, Article $article)
    {
        $article->update($request->all());

        return redirect()->route('all_articles');
    }


    public function destroy(Article $article)
    {
        $article->delete();

        return redirect()->route('all_articles');
    }
}

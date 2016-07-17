@extends('layouts.dashboard')

@section('page_title')
    Статьи
@endsection

@section('content_title')
    Все статьи
@endsection

@section('content')
    @foreach ($articles as $article)
        <div class="media">
            <div class="media-left">
                <a href="{{ route('show_article', $article->id) }}">
                    <img class="media-object" src="{{ asset($article->preview->thumbnail_path) }}" alt="">
                </a>
            </div>
            <div class="media-body">
                <h4 class="media-heading"><a href="{{ route('show_article', $article->id) }}">{{ $article->title }}</a></h4>
                <p>{!! nl2br($article->text) !!}</p>
                <a href="{{ route('edit_article', $article->id) }}">
                    <span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>
                    edit
                </a> |
                    <form action="{{ route('delete_article', $article->id) }}" method="post">
                        {{ csrf_field() }}
                        <button type="submit"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                    </form>
            </div>
        </div>
        <hr>
    @endforeach
    @include('pagination.dashboard_article',['paginator' => $articles])
    <br>
    <p><a class="btn btn-primary btn-square" href="{{ route('create_article') }}">Создать страницу</a></p>
@endsection
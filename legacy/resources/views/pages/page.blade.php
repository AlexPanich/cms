@extends('templates.' . $page->template->getSlug())

@section('title')
{{ $page->title }}
@endsection

@section('keywords')
{{ $page->keywords }}
@endsection

@section('description')
{{ $page->description }}
@endsection

@section('page_title')
    <span @frontWidget(page, $page)>
        <span @frontField(title, input)>{{ $page->title }}</span>
    </span>
@endsection

@section('content')
    <div @frontWidget(page, $page)>
        <div @frontField(content, tiny)>
            @widget('ReplaceWidget', [], $page->content)
        </div>
    </div>
@endsection


